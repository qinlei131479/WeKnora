export default function parseProperty(object: any, property: string, newProperty?: string) {
  const str = object[property];
  if (str && typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      object[newProperty || property] = obj;
    } catch (error) {
      console.log(error);
    }
  }
}
