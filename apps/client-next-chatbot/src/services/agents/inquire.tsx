import type { ExperimentalMessage } from 'ai';
import type { createStreamableUI } from 'ai/rsc';
import { OpenAI } from '@ai-sdk/openai';
import { experimental_streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';

import type { PartialInquirySchema } from '~/services/schema/inquiry';
import { Copilot } from '~/components/chatbot/copilot';
import { inquirySchema } from '~/services/schema/inquiry';

export async function inquire(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: ExperimentalMessage[],
) {
  const openai = new OpenAI();
  const objectStream = createStreamableValue<PartialInquirySchema>();
  uiStream.update(<Copilot inquiry={objectStream.value} />);

  let finalInquiry: PartialInquirySchema = {};
  await experimental_streamObject({
    model: openai.chat('gpt-3.5-turbo'),
    system: `As a professional web researcher, your role is to deepen your understanding of the user's input by conducting further inquiries when necessary.
    After receiving an initial response from the user, carefully assess whether additional questions are absolutely essential to provide a comprehensive and accurate answer. Only proceed with further inquiries if the available information is insufficient or ambiguous.

    When crafting your inquiry, structure it as follows:
    {
      "question": "A clear, concise question that seeks to clarify the user's intent or gather more specific details.",
      "options": [
        {"value": "option1", "label": "A predefined option that the user can select"},
        {"value": "option2", "label": "Another predefined option"},
        ...
      ],
      "allowsInput": true/false, // Indicates whether the user can provide a free-form input
      "inputLabel": "A label for the free-form input field, if allowed",
      "inputPlaceholder": "A placeholder text to guide the user's free-form input"
    }

    For example:
    {
      "question": "What specific information are you seeking about Rivian?",
      "options": [
        {"value": "history", "label": "History"},
        {"value": "products", "label": "Products"},
        {"value": "investors", "label": "Investors"},
        {"value": "partnerships", "label": "Partnerships"},
        {"value": "competitors", "label": "Competitors"}
      ],
      "allowsInput": true,
      "inputLabel": "If other, please specify",
      "inputPlaceholder": "e.g., Specifications"
    }

    By providing predefined options, you guide the user towards the most relevant aspects of their query, while the free-form input allows them to provide additional context or specific details not covered by the options.
    Remember, your goal is to gather the necessary information to deliver a thorough and accurate response.
    Please match the language of the response to the user's language.
    `,
    messages,
    schema: inquirySchema,
  })
    .then(async (result) => {
      for await (const obj of result.partialObjectStream) {
        if (obj) {
          objectStream.update(obj);
          finalInquiry = obj;
        }
      }
    })
    .finally(() => {
      objectStream.done();
    });

  return finalInquiry;
}