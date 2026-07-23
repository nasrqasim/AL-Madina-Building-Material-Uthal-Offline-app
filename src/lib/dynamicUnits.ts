/**
 * Dynamic Unit System for Building Material ERP
 * 
 * This replaces the oil-specific carton/gallon/liter conversion logic
 * with a flexible system that reads unit configuration from Product Master.
 * 
 * Each product has:
 * - unit: Display unit (e.g., "Per Bag", "Per KG")
 * - baseUnit: Base inventory unit
 * - purchaseUnit: Purchase unit
 * - saleUnit: Sale unit
 * - conversionFactor: Conversion from base unit to sale unit
 */

export interface ProductUnitConfig {
  unit?: string;           // Display/selling unit
  baseUnit?: string;       // Base inventory unit
  purchaseUnit?: string;   // Purchase unit
  saleUnit?: string;       // Sale unit
  conversionFactor?: number; // Conversion factor
}

/**
 * Get the display unit for a product
 * Falls back to unit field, then baseUnit, then "Per Piece"
 */
export function getProductUnit(product: ProductUnitConfig | null | undefined): string {
  if (!product) return "Per Piece";
  return product.unit || product.baseUnit || "Per Piece";
}

/**
 * Get the sale unit for a product
 * Falls back to unit, then baseUnit, then "Per Piece"
 */
export function getSaleUnit(product: ProductUnitConfig | null | undefined): string {
  if (!product) return "Per Piece";
  return product.saleUnit || product.unit || product.baseUnit || "Per Piece";
}

/**
 * Get the purchase unit for a product
 * Falls back to unit, then baseUnit, then "Per Piece"
 */
export function getPurchaseUnit(product: ProductUnitConfig | null | undefined): string {
  if (!product) return "Per Piece";
  return product.purchaseUnit || product.unit || product.baseUnit || "Per Piece";
}

/**
 * Format quantity with unit for display
 * Example: formatQuantityWithUnit(25, "Per Bag") => "25 Bags"
 */
export function formatQuantityWithUnit(quantity: number, unit: string): string {
  if (!unit) return quantity.toString();
  
  // Remove "Per " prefix for plural display
  const displayUnit = unit.replace(/^Per\s+/i, '');
  
  // Handle pluralization
  if (quantity === 1) {
    return `${quantity} ${displayUnit}`;
  }
  
  // Simple pluralization (add 's' if not already plural)
  const pluralUnit = displayUnit.endsWith('s') ? displayUnit : `${displayUnit}s`;
  return `${quantity} ${pluralUnit}`;
}

/**
 * Format quantity with unit from product configuration
 */
export function formatProductQuantity(quantity: number, product: ProductUnitConfig | null | undefined): string {
  const unit = getProductUnit(product);
  return formatQuantityWithUnit(quantity, unit);
}

/**
 * Get conversion factor between units
 * Currently returns 1 as all units are treated as base units
 * This can be extended if complex unit conversions are needed
 */
export function getConversionFactor(product: ProductUnitConfig | null | undefined): number {
  if (!product) return 1;
  return product.conversionFactor || 1;
}

/**
 * Convert quantity from one unit to another
 * Currently identity conversion as units are not hierarchical
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  // For now, return same quantity as units are independent
  // This can be extended with conversion tables if needed
  return quantity;
}

/**
 * Get unit label for display in forms/tables
 * Returns short form without "Per " prefix
 */
export function getUnitLabel(unit: string): string {
  return unit.replace(/^Per\s+/i, '');
}

/**
 * Validate unit configuration
 * Ensures all required unit fields are present
 */
export function validateUnitConfig(product: ProductUnitConfig): boolean {
  return !!(product && (product.unit || product.baseUnit));
}

/**
 * Get all available unit options for dropdowns
 */
export const UNIT_OPTIONS = [
  "Per Bag",
  "Per Piece",
  "Per KG",
  "Per Ton",
  "Per Feet",
  "Per Meter",
  "Per Box",
  "Per Carton",
  "Per Sheet",
  "Per Bundle",
  "Per Square Feet",
  "Per Square Meter",
] as const;

export type UnitOption = typeof UNIT_OPTIONS[number];
