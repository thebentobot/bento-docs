import { z } from "zod";

export const choiceSchema = z.object({
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
});
export const optionSchema = z.object({
    name: z.string(),
    description: z.string(),
    type: z.string(),
    required: z.boolean(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).nullish(),
    choices: z.array(choiceSchema),
    autocomplete: z.boolean(),
    minValue: z.number().nullish(),
    maxValue: z.number().nullish(),
    minLength: z.number().int().nullish(),
    maxLength: z.number().int().nullish(),
    channelTypes: z.array(z.string()),
});
export const commandSchema = z.object({
    id: z.string(),
    path: z.array(z.string()).min(1),
    invocation: z.string().startsWith("/"),
    description: z.string(),
    groupPath: z.array(z.object({ name: z.string(), description: z.string() })),
    guildOnly: z.boolean(),
    requiredUserPermissions: z.array(z.string()),
    options: z.array(optionSchema),
});
export const manifestSchema = z.object({
    schemaVersion: z.literal(1),
    commands: z.array(commandSchema),
});
export type CommandManifest = z.infer<typeof manifestSchema>;
export type Command = z.infer<typeof commandSchema>;
