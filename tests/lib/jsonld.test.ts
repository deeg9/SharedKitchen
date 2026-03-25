import {
  extractJsonLd,
  parseIsoDuration,
  extractImageUrl,
  mapSchemaOrgToRecipe,
  parseSchemaIngredients,
  parseSchemaInstructions,
  mapNutrition,
} from '../../src/lib/jsonld';

describe('jsonld', () => {
  describe('extractJsonLd', () => {
    it('extracts Recipe from a single JSON-LD script tag', () => {
      const html = '<html><head><script type="application/ld+json">{"@type":"Recipe","name":"Pasta"}</script></head></html>';
      const result = extractJsonLd(html);
      expect(result).not.toBeNull();
      expect(result!['@type']).toBe('Recipe');
      expect(result!.name).toBe('Pasta');
    });

    it('handles @graph arrays and returns Recipe object', () => {
      const html = '<script type="application/ld+json">{"@graph":[{"@type":"WebPage","name":"My Blog"},{"@type":"Recipe","name":"Soup"}]}</script>';
      const result = extractJsonLd(html);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Soup');
    });

    it('returns null when no Recipe type found', () => {
      const html = '<script type="application/ld+json">{"@type":"Article","name":"Blog Post"}</script>';
      const result = extractJsonLd(html);
      expect(result).toBeNull();
    });

    it('handles multiple script tags and returns first Recipe', () => {
      const html = `
        <script type="application/ld+json">{"@type":"Organization","name":"Org"}</script>
        <script type="application/ld+json">{"@type":"Recipe","name":"First Recipe"}</script>
        <script type="application/ld+json">{"@type":"Recipe","name":"Second Recipe"}</script>
      `;
      const result = extractJsonLd(html);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('First Recipe');
    });

    it('returns null for invalid JSON', () => {
      const html = '<script type="application/ld+json">{invalid json}</script>';
      const result = extractJsonLd(html);
      expect(result).toBeNull();
    });

    it('returns null for empty HTML', () => {
      const result = extractJsonLd('');
      expect(result).toBeNull();
    });
  });

  describe('parseIsoDuration', () => {
    it('parses PT30M to 1800 seconds', () => {
      expect(parseIsoDuration('PT30M')).toBe(1800);
    });

    it('parses PT1H15M to 4500 seconds', () => {
      expect(parseIsoDuration('PT1H15M')).toBe(4500);
    });

    it('parses PT45S to 45 seconds', () => {
      expect(parseIsoDuration('PT45S')).toBe(45);
    });

    it('returns 0 for invalid input', () => {
      expect(parseIsoDuration('invalid')).toBe(0);
    });

    it('parses PT2H to 7200 seconds', () => {
      expect(parseIsoDuration('PT2H')).toBe(7200);
    });

    it('parses PT1H30M45S to 5445 seconds', () => {
      expect(parseIsoDuration('PT1H30M45S')).toBe(5445);
    });
  });

  describe('extractImageUrl', () => {
    it('handles string input', () => {
      expect(extractImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    it('handles string array input (picks first)', () => {
      expect(extractImageUrl(['https://example.com/a.jpg', 'https://example.com/b.jpg'])).toBe('https://example.com/a.jpg');
    });

    it('handles ImageObject array input (picks first url)', () => {
      expect(extractImageUrl([{ url: 'https://example.com/c.jpg' }, { url: 'https://example.com/d.jpg' }])).toBe('https://example.com/c.jpg');
    });

    it('returns null for undefined/null', () => {
      expect(extractImageUrl(undefined as any)).toBeNull();
      expect(extractImageUrl(null as any)).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(extractImageUrl([])).toBeNull();
    });
  });

  describe('parseSchemaIngredients', () => {
    it('parses "2 cups flour" correctly', () => {
      const result = parseSchemaIngredients(['2 cups flour']);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ amount: 2, unit: 'cups', name: 'flour' });
    });

    it('parses ingredient without unit', () => {
      const result = parseSchemaIngredients(['3 eggs']);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(3);
      expect(result[0].name).toContain('eggs');
    });

    it('parses ingredient without amount', () => {
      const result = parseSchemaIngredients(['salt to taste']);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(1);
      expect(result[0].name).toContain('salt');
    });

    it('handles fraction amounts', () => {
      const result = parseSchemaIngredients(['1/2 cup sugar']);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(0.5);
      expect(result[0].unit).toBe('cup');
      expect(result[0].name).toBe('sugar');
    });

    it('handles multiple ingredients', () => {
      const result = parseSchemaIngredients(['2 cups flour', '1 tsp salt', '3 tbsp butter']);
      expect(result).toHaveLength(3);
    });
  });

  describe('parseSchemaInstructions', () => {
    it('handles plain string instruction', () => {
      const result = parseSchemaInstructions('Mix everything together. Bake at 350F.');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].step_number).toBe(1);
    });

    it('handles array of strings', () => {
      const result = parseSchemaInstructions(['Preheat oven', 'Mix ingredients', 'Bake']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ step_number: 1, text: 'Preheat oven' });
      expect(result[2]).toEqual({ step_number: 3, text: 'Bake' });
    });

    it('handles HowToStep objects', () => {
      const result = parseSchemaInstructions([
        { '@type': 'HowToStep', text: 'Step one text' },
        { '@type': 'HowToStep', text: 'Step two text' },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Step one text');
    });

    it('handles HowToSection objects', () => {
      const result = parseSchemaInstructions([
        {
          '@type': 'HowToSection',
          name: 'Prep',
          itemListElement: [
            { '@type': 'HowToStep', text: 'Chop onions' },
            { '@type': 'HowToStep', text: 'Dice tomatoes' },
          ],
        },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Chop onions');
      expect(result[1].text).toBe('Dice tomatoes');
    });

    it('extracts timer data from HowToStep with ISO 8601 durations', () => {
      const result = parseSchemaInstructions([
        { '@type': 'HowToStep', text: 'Simmer for 30 minutes', duration: 'PT30M' },
      ]);
      expect(result[0].timers).toBeDefined();
      expect(result[0].timers![0].duration_seconds).toBe(1800);
    });
  });

  describe('mapNutrition', () => {
    it('maps schema.org nutrition info', () => {
      const result = mapNutrition({
        '@type': 'NutritionInformation',
        calories: '250 calories',
        proteinContent: '15g',
        fatContent: '10g',
        carbohydrateContent: '30g',
      });
      expect(result).not.toBeNull();
      expect(result!.calories).toBe('250 calories');
      expect(result!.protein).toBe('15g');
      expect(result!.fat).toBe('10g');
      expect(result!.carbohydrates).toBe('30g');
    });

    it('returns null for missing nutrition', () => {
      expect(mapNutrition(undefined)).toBeNull();
      expect(mapNutrition(null as any)).toBeNull();
    });
  });

  describe('mapSchemaOrgToRecipe', () => {
    it('maps name, image, prepTime, cookTime, servings, category, ingredients, instructions', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Test Recipe',
        image: 'https://example.com/img.jpg',
        prepTime: 'PT15M',
        cookTime: 'PT30M',
        recipeYield: '4 servings',
        recipeCategory: 'Italian',
        recipeIngredient: ['2 cups flour', '1 tsp salt'],
        recipeInstructions: ['Mix', 'Bake'],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.name).toBe('Test Recipe');
      expect(result.source_image_url).toBe('https://example.com/img.jpg');
      expect(result.prep_time_minutes).toBe(15);
      expect(result.cook_time_minutes).toBe(30);
      expect(result.servings).toBe(4);
      expect(result.category).toBe('Italian');
      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
    });

    it('extracts nutrition info', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Nutritious Recipe',
        recipeIngredient: ['1 cup rice'],
        recipeInstructions: ['Cook rice'],
        nutrition: {
          '@type': 'NutritionInformation',
          calories: '300 cal',
          proteinContent: '8g',
          fatContent: '2g',
          carbohydrateContent: '60g',
        },
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.nutrition_info).not.toBeNull();
      expect(result.nutrition_info!.calories).toBe('300 cal');
    });

    it('handles image as array of strings (picks first)', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Test',
        image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        recipeIngredient: ['1 cup water'],
        recipeInstructions: ['Boil'],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.source_image_url).toBe('https://example.com/a.jpg');
    });

    it('handles image as ImageObject array (picks first url)', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Test',
        image: [{ url: 'https://example.com/c.jpg' }],
        recipeIngredient: ['1 cup water'],
        recipeInstructions: ['Boil'],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.source_image_url).toBe('https://example.com/c.jpg');
    });

    it('normalizes recipeInstructions from HowToStep objects', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Test',
        recipeIngredient: ['1 cup water'],
        recipeInstructions: [
          { '@type': 'HowToStep', text: 'Step 1' },
          { '@type': 'HowToStep', text: 'Step 2' },
        ],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.instructions).toHaveLength(2);
      expect(result.instructions![0].text).toBe('Step 1');
    });

    it('normalizes recipeInstructions from HowToSection objects', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Test',
        recipeIngredient: ['1 cup water'],
        recipeInstructions: [
          {
            '@type': 'HowToSection',
            name: 'Section 1',
            itemListElement: [
              { '@type': 'HowToStep', text: 'Sub step 1' },
            ],
          },
        ],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.instructions).toHaveLength(1);
      expect(result.instructions![0].text).toBe('Sub step 1');
    });

    it('extracts timer data from HowToStep objects with ISO 8601 durations', () => {
      const schema = {
        '@type': 'Recipe' as const,
        name: 'Timer Test',
        recipeIngredient: ['1 cup water'],
        recipeInstructions: [
          { '@type': 'HowToStep', text: 'Boil for 10 minutes', duration: 'PT10M' },
        ],
      };
      const result = mapSchemaOrgToRecipe(schema);
      expect(result.instructions![0].timers).toBeDefined();
      expect(result.instructions![0].timers![0].duration_seconds).toBe(600);
    });
  });
});
