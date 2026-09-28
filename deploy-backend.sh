#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -euo pipefail

export AWS_DEFAULT_REGION="ap-south-1"
AWS_REGION="${AWS_REGION:-$AWS_DEFAULT_REGION}"

# CONFIGURATION PARAMS
# Set this to the name of our backend Auto Scaling Group
ASG_NAME="dashboard-charts-pulse-auto-scaling-group" 
PROJECT_DIR="/home/ubuntu/pulse-dashboard"
GIT_REPO_URL="https://github.com/SatvikPurohit/chart-dashboard-api.git"

# Required environment variables:
#   ASG_NAME       e.g. pulse-dashboard-asg
#   AWS_REGION     e.g. ap-south-1
# Optional:
#   MAX_CONCURRENCY defaults to 2

: "${ASG_NAME:?Set ASG_NAME first}"
: "${AWS_REGION:?Set AWS_REGION first}"

MAX_CONCURRENCY="${MAX_CONCURRENCY:-2}"

echo "Step 1: Gathering target EC2 Instance IDs from Auto Scaling Group..."
# Fetches all active instance IDs currently running inside our backend ASG
INSTANCE_IDS_TEXT=$(aws autoscaling describe-auto-scaling-groups \
    --region "$AWS_REGION" \
    --auto-scaling-group-names "$ASG_NAME" \
    --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
    --output text)

if [ -z "$INSTANCE_IDS_TEXT" ] || [ "$INSTANCE_IDS_TEXT" = "None" ]; then
    echo "!!Error!!: No active 'InService' EC2 instances found in Auto Scaling Group $ASG_NAME."
    exit 1
fi

# AWS CLI text output separates multiple IDs with tabs; convert it to a Bash array.
read -r -a INSTANCE_IDS <<< "$INSTANCE_IDS_TEXT"

echo "Found ${#INSTANCE_IDS[@]} active instance(s): ${INSTANCE_IDS[*]}"

echo "Step 2: Executing remote deployment script via AWS SSM Run Command..."
# Sends the build instructions to all target backend servers simultaneously
# AWS SSM (Systems Manager) SSM : doesn't care about IP addresses or SSH keys. 
# It talks directly to the servers through AWS's internal security network. 
# It tells the ASG: "Give me whatever instances are alive right now," and updates them all simultaneously.
# Send the deployment script through AWS Systems Manager Run Command.
# Replace i-YOUR_INSTANCE_ID with our EC2 instance ID.
COMMAND_ID=$(
  aws ssm send-command \
    --region "$AWS_REGION" \
    --document-name "AWS-RunShellScript" \
    --instance-ids "${INSTANCE_IDS[@]}" \
    --max-concurrency "$MAX_CONCURRENCY" \
    --max-errors "1" \
    --comment "Deploy Pulse Dashboard API" \
    --parameters '{
      "commands": [
        "set -e",
        "",
        "# Step 1: Prepare the deployment directory",
        "echo \"Step 1: Opening deployment directory...\"",
        "mkdir -p /home/ubuntu/pulse-dashboard",
        "cd /home/ubuntu/pulse-dashboard",
        "",
        "# Step 2: Clone or update the repository safely",
        "echo \"Step 2: Fetching the latest source code...\"",
        "if [ -d .git ]; then git fetch origin main && git reset --hard origin/main; elif [ -z \"$(ls -A .)\" ]; then git clone https://github.com/SatvikPurohit/chart-dashboard-api.git .; else echo \"ERROR: Deployment directory is not empty and is not a Git repository.\"; exit 1; fi",
        "",
        "# Step 3: Retrieve the ignored production environment on every ASG instance",
        "echo \"Step 3: Fetching the production environment from Parameter Store...\"",
        "command -v aws >/dev/null || { echo \"ERROR: AWS CLI is required on this instance to retrieve /pulse-dashboard/prod/env.\"; exit 1; }",
        "aws ssm get-parameter --region ap-south-1 --name /pulse-dashboard/prod/env --with-decryption --query Parameter.Value --output text > .env.prod",
        "chmod 600 .env.prod",
        "# Step 4: Determine this instance private address for internal Kafka routing",
        "echo \"Step 4: Reading this instance private IP...\"",
        "TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H X-aws-ec2-metadata-token-ttl-seconds:21600)",
        "export KAFKA_HOST=$(curl -fsS -H X-aws-ec2-metadata-token:$TOKEN http://169.254.169.254/latest/meta-data/local-ipv4)",
        "echo \"Kafka host: $KAFKA_HOST\"",
        "",
        "# Step 5: Stop this instance’s existing production stack without deleting data volumes",
        "echo \"Step 5: Stopping existing containers...\"",
        "sudo docker compose --env-file .env.prod -f docker-compose-prod.yml down",
        "",
        "# Step 6: Build and launch the updated production stack",
        "echo \"Step 6: Building and starting containers...\"",
        "sudo docker compose --env-file .env.prod -f docker-compose-prod.yml up -d --build",
        "",
        "# Step 7: Verify the instance’s containers",
        "echo \"Step 7: Verifying containers...\"",
        "sudo docker ps"
      ]
    }' \
    --query "Command.CommandId" \
    --output text
)

echo "SSM command submitted: $COMMAND_ID"
echo "Waiting for every targeted instance..."

FAILED=0

for INSTANCE_ID in "${INSTANCE_IDS[@]}"; do
  echo "Waiting for $INSTANCE_ID..."

  if aws ssm wait command-executed \
    --region "$AWS_REGION" \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID"; then
    echo "SUCCESS: $INSTANCE_ID"
  else
    echo "FAILED: $INSTANCE_ID"
    FAILED=1
  fi

  # Always print this instance's remote stdout/stderr for CI logs.
  aws ssm get-command-invocation \
    --region "$AWS_REGION" \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --plugin-name "aws:runShellScript" \
    --query '{Status:Status,ResponseCode:ResponseCode,Stdout:StandardOutputContent,Stderr:StandardErrorContent}' \
    --output json || true
done

if [[ "$FAILED" -ne 0 ]]; then
  echo "ERROR: Deployment failed on one or more instances."
  exit 1
fi

echo "SUCCESS: Deployment completed on all instances."
exit 0
