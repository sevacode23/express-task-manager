export default function validateProps(allowedProps: string[], receivedObject: object): boolean {
  const receivedProps = Object.keys(receivedObject);
  const isValidPropsObject = receivedProps.every((prop) => allowedProps.includes(prop));
  return isValidPropsObject;
}
