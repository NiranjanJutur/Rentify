import { propertyService } from './dataService';

export const getPrimaryProperty = async () => {
  const properties = await propertyService.getAll();
  if (!properties || properties.length === 0) {
    return null;
  }
  return properties[0];
};

export const requirePrimaryPropertyId = async () => {
  const property = await getPrimaryProperty();
  if (!property?.id) {
    throw new Error('Please register a property first. Worker, expense, and maintenance records need a property.');
  }
  return property.id as string;
};
