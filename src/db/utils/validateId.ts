import { Types as mongooseTypes } from "mongoose";

export default function validateId(_id: any): boolean {
  return mongooseTypes.ObjectId.isValid(_id);
}
