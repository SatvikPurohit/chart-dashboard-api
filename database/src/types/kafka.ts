import { Producer } from "kafkajs";
import { Request } from "express";

export interface KafkaRequest extends Request {
  kafkaProducer?: Producer;
}
