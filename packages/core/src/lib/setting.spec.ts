import { describe, it, expectTypeOf } from 'vitest';
import { lSetting } from './setting';
import { IDataDriver, IFilesDriver } from '@listedbase/driver-abstract';

describe('lSetting.sources type-level tests', () => {
  it('should accept valid primary source configuration', () => {
    const mockDataDriver = {} as IDataDriver;

    expectTypeOf(lSetting.sources).toBeCallableWith({
      primary: {
        data: mockDataDriver,
      },
    });
  });

  it('should accept valid primary and replica configuration with files driver', () => {
    const mockDataDriver = {} as IDataDriver;
    const mockFilesDriver = {} as IFilesDriver;

    expectTypeOf(lSetting.sources).toBeCallableWith({
      primary: {
        data: mockDataDriver,
        files: mockFilesDriver,
      },
      replica: {
        data: mockDataDriver,
      },
    });
  });

  it('should reject configuration missing primary', () => {
    // @ts-expect-error - Primary is required
    lSetting.sources({});
  });

  it('should reject invalid files driver type', () => {
    const mockDataDriver = {} as IDataDriver;

    lSetting.sources({
      primary: {
        data: mockDataDriver,
        // @ts-expect-error - Invalid files driver type
        files: { invalid: true },
      },
    });
  });
});
