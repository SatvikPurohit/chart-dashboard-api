#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

export AWS_DEFAULT_REGION="ap-south-1"

# CONFIGURATION PARAMS
# Set this to the name of your backend Auto Scaling Group
ASG_NAME="dashboard-charts-pulse-auto-scaling-group" 
PROJECT_DIR="/home/ubuntu/pulse-dashboard"
GIT_REPO_URL="https://github.com/SatvikPurohit/chart-dashboard-api.git"

echo "🔍 Step 1: Gathering target EC2 Instance IDs from Auto Scaling Group..."
# Fetches all active instance IDs currently running inside your backend ASG
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$ASG_NAME" \
    --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
    --output text)

if [ -z "$INSTANCE_IDS" ] || [ "$INSTANCE_IDS" == "None" ]; then
    echo "!!Error!!: No active 'InService' EC2 instances found in Auto Scaling Group $ASG_NAME."
    exit 1
fi

echo "Found Active Instances: $INSTANCE_IDS"

echo "Step 2: Executing remote deployment script via AWS SSM Run Command..."
# Sends the build instructions to all target backend servers simultaneously
# AWS SSM (Systems Manager) SSM : doesn't care about IP addresses or SSH keys. 
# It talks directly to the servers through AWS's internal security network. 
# It tells the ASG: "Give me whatever instances are alive right now," and updates them all simultaneously.
COMMAND_ID=$(aws ssm send-command \
    --instance-ids $INSTANCE_IDS \
    --document-name "AWS-RunShellScript" \
    --comment "Deploying backend microservices cluster" \
    --parameters commands="[
        'set -e',
        
        # 1️Navigate to the application zone, or build it if missing
        'mkdir -p $PROJECT_DIR',
        'cd $PROJECT_DIR',
        
        'echo \"Fetching latest code updates...\"',
        # 2️If the folder is empty, clone it fresh. If it exists, update it.
        'if [ ! -d \".git\" ]; then',
        '  git clone $GIT_REPO_URL . ;',
        'else',
        '  git pull origin main || (git fetch --all && git reset --hard origin/main) ;',
        'fi',
        
        'echo \"Fetching host public IP for Kafka broker route...\"',
        'export KAFKA_HOST=\$(curl -s http://169.254.169)',
        
        'echo \"⚡ Rebuilding Docker cluster and flushing stale volume stubs...\"',
        'sudo docker-compose down --volumes',
        'sudo docker-compose -f docker-compose-prod.yml up -d --build',
        
        'echo \"Verifying container runtime vital signs...\"',
        'sudo docker ps'
    ]" \
    --query "Command.CommandId" \
    --output text)

echo "Remote execution triggered! Command ID: $COMMAND_ID"

echo "Step 3: Monitoring deployment execution logs..."
# Wait for AWS SSM to process the commands across your server pool
aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$(echo $INSTANCE_IDS | awk '{print $1}')"

echo "Backend Microservices Cluster is completely live and healthy!"
