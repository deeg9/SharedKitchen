import { colors } from '../src/theme/colors';
import { typography, fontFamily } from '../src/theme/typography';
import { shadows } from '../src/theme/shadows';
import { spacing, borderRadius } from '../src/theme/spacing';

describe('Design System Tokens', () => {
  describe('Colors', () => {
    it('has correct primary color', () => {
      expect(colors.primary).toBe('#334537');
    });

    it('has correct secondary color', () => {
      expect(colors.secondary).toBe('#904d00');
    });

    it('has correct surface color', () => {
      expect(colors.surface).toBe('#fbf9f5');
    });

    it('has all surface container tiers', () => {
      expect(colors.surfaceContainerLowest).toBeDefined();
      expect(colors.surfaceContainerLow).toBeDefined();
      expect(colors.surfaceContainer).toBeDefined();
      expect(colors.surfaceContainerHigh).toBeDefined();
      expect(colors.surfaceContainerHighest).toBeDefined();
    });

    it('has error tokens', () => {
      expect(colors.error).toBe('#ba1a1a');
      expect(colors.onError).toBe('#ffffff');
    });
  });

  describe('Typography', () => {
    it('has fontFamily defined for all typography presets', () => {
      const presetNames = Object.keys(typography);
      expect(presetNames.length).toBeGreaterThanOrEqual(11);

      for (const name of presetNames) {
        expect(typography[name].fontFamily).toBeDefined();
      }
    });

    it('uses Plus Jakarta Sans for headlines', () => {
      expect(fontFamily.headlineBold).toContain('PlusJakartaSans');
      expect(fontFamily.headlineExtraBold).toContain('PlusJakartaSans');
    });

    it('uses Inter for body text', () => {
      expect(fontFamily.body).toContain('Inter');
      expect(fontFamily.bodySemiBold).toContain('Inter');
    });
  });

  describe('Shadows', () => {
    it('has editorial shadow with expected structure', () => {
      expect(shadows.editorial).toHaveProperty('shadowColor');
      expect(shadows.editorial).toHaveProperty('shadowOffset');
      expect(shadows.editorial).toHaveProperty('shadowOpacity');
      expect(shadows.editorial).toHaveProperty('shadowRadius');
      expect(shadows.editorial).toHaveProperty('elevation');
    });

    it('has float and tabBar shadow presets', () => {
      expect(shadows.float).toBeDefined();
      expect(shadows.tabBar).toBeDefined();
    });
  });

  describe('Spacing', () => {
    it('follows 8px grid', () => {
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
    });

    it('has border radius scale', () => {
      expect(borderRadius.sm).toBe(8);
      expect(borderRadius.full).toBe(9999);
    });
  });
});
