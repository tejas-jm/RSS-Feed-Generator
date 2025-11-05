import { z } from 'zod';

export const fieldSelectorSchema = z
  .object({
    selector: z.string().min(1).optional(),
    xpath: z.string().min(1).optional(),
    attr: z.string().min(1).optional(),
    regex: z.string().optional(),
    replace: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
        })
      )
      .optional(),
    absoluteUrl: z.boolean().optional(),
    required: z.boolean().optional(),
    multiple: z.boolean().optional(),
    dateFormat: z.string().optional(),
  })
  .strict();

export type FieldSelector = z.infer<typeof fieldSelectorSchema>;

export const fieldsConfigSchema = z
  .object({
    itemList: fieldSelectorSchema.optional(),
    item: fieldSelectorSchema.optional(),
    title: fieldSelectorSchema.optional(),
    link: fieldSelectorSchema.optional(),
    description: fieldSelectorSchema.optional(),
    date: fieldSelectorSchema.optional(),
    image: fieldSelectorSchema.optional(),
    author: fieldSelectorSchema.optional(),
    category: fieldSelectorSchema.optional(),
    tags: fieldSelectorSchema.optional(),
    custom: z.record(fieldSelectorSchema).optional(),
  })
  .strict();

export type FieldsConfig = z.infer<typeof fieldsConfigSchema>;
