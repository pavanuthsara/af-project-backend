const DisposalActivity = require('../../../src/domain/entities/DisposalActivity');

describe('DisposalActivity Entity', () => {
  const validArgs = ['id-1', 'user-1', 'waste-1', 2, 1.5, 'kg'];

  describe('constructor & validate()', () => {
    test('should create a valid DisposalActivity', () => {
      const activity = new DisposalActivity(...validArgs);
      expect(activity.id).toBe('id-1');
      expect(activity.userId).toBe('user-1');
      expect(activity.wasteId).toBe('waste-1');
      expect(activity.quantity).toBe(2);
      expect(activity.weight).toBe(1.5);
      expect(activity.unit).toBe('kg');
    });

    test('should default timestamp to a Date when not provided', () => {
      const before = new Date();
      const activity = new DisposalActivity(...validArgs);
      const after = new Date();
      expect(activity.timestamp).toBeInstanceOf(Date);
      expect(activity.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(activity.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('should accept optional fields (disposalGuideline, co2Saved, co2Source, disposalMethod)', () => {
      const activity = new DisposalActivity(
        'id-1', 'user-1', 'waste-1', 2, 1.5, 'kg',
        new Date(), 'recycle', 0.5, 'climatiq', 'recycling'
      );
      expect(activity.disposalGuideline).toBe('recycle');
      expect(activity.co2Saved).toBe(0.5);
      expect(activity.co2Source).toBe('climatiq');
      expect(activity.disposalMethod).toBe('recycling');
    });

    test('should throw error when userId is missing', () => {
      expect(() => new DisposalActivity(null, null, 'waste-1', 2, 1.5, 'kg'))
        .toThrow('User ID is required');
    });

    test('should throw error when wasteId is missing', () => {
      expect(() => new DisposalActivity(null, 'user-1', null, 2, 1.5, 'kg'))
        .toThrow('Waste ID is required');
    });

    test('should throw error when quantity is zero', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 0, 1.5, 'kg'))
        .toThrow('Quantity must be a positive number');
    });

    test('should throw error when quantity is negative', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', -1, 1.5, 'kg'))
        .toThrow('Quantity must be a positive number');
    });

    test('should throw error when quantity is not a number', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 'two', 1.5, 'kg'))
        .toThrow('Quantity must be a positive number');
    });

    test('should throw error when weight is zero', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 2, 0, 'kg'))
        .toThrow('Weight must be a positive number');
    });

    test('should throw error when weight is negative', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 2, -5, 'kg'))
        .toThrow('Weight must be a positive number');
    });

    test('should throw error when unit is invalid', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 2, 1.5, 'pounds'))
        .toThrow('Invalid unit. Must be one of: kg, g, lbs, oz');
    });

    test('should throw error when unit is missing', () => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 2, 1.5, ''))
        .toThrow('Invalid unit. Must be one of: kg, g, lbs, oz');
    });

    test.each(['kg', 'g', 'lbs', 'oz'])('should accept valid unit: %s', (unit) => {
      expect(() => new DisposalActivity(null, 'user-1', 'waste-1', 2, 1.5, unit))
        .not.toThrow();
    });
  });

  describe('getWeightInKg()', () => {
    test('should return weight as-is for kg', () => {
      const activity = new DisposalActivity(null, 'user-1', 'waste-1', 1, 5, 'kg');
      expect(activity.getWeightInKg()).toBe(5);
    });

    test('should convert grams to kg', () => {
      const activity = new DisposalActivity(null, 'user-1', 'waste-1', 1, 500, 'g');
      expect(activity.getWeightInKg()).toBeCloseTo(0.5);
    });

    test('should convert lbs to kg', () => {
      const activity = new DisposalActivity(null, 'user-1', 'waste-1', 1, 10, 'lbs');
      expect(activity.getWeightInKg()).toBeCloseTo(4.53592);
    });

    test('should convert oz to kg', () => {
      const activity = new DisposalActivity(null, 'user-1', 'waste-1', 1, 16, 'oz');
      expect(activity.getWeightInKg()).toBeCloseTo(0.453592);
    });
  });

  describe('DisposalActivity.create() factory method', () => {
    test('should create a DisposalActivity with id=null', () => {
      const activity = DisposalActivity.create('user-1', 'waste-1', 3, 2.0, 'kg');
      expect(activity).toBeInstanceOf(DisposalActivity);
      expect(activity.id).toBeNull();
    });

    test('should pass through optional CO₂ fields', () => {
      const activity = DisposalActivity.create(
        'user-1', 'waste-1', 3, 2.0, 'kg', 'compost', 1.2, 'epa-warm', 'composting'
      );
      expect(activity.disposalGuideline).toBe('compost');
      expect(activity.co2Saved).toBe(1.2);
      expect(activity.co2Source).toBe('epa-warm');
      expect(activity.disposalMethod).toBe('composting');
    });

    test('should default optional fields to null', () => {
      const activity = DisposalActivity.create('user-1', 'waste-1', 1, 1, 'g');
      expect(activity.disposalGuideline).toBeNull();
      expect(activity.co2Saved).toBeNull();
      expect(activity.co2Source).toBeNull();
      expect(activity.disposalMethod).toBeNull();
    });
  });
});
