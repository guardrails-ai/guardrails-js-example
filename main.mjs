import assert from "node:assert";
import process from "node:process";
import { Guard, Validators, exit } from "@guardrails-ai/core";
import OpenAI from "openai";
const openai = new OpenAI();

process.on("exit", (code) => {
  console.log(`About to exit with code: ${code}`);
  exit();
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Please generate a single word with a length of between 1 and 10 characters. Do not exceed 10 characters in length. Do not include punctuation.",
        },
      ],
      model: "gpt-3.5-turbo",
    });
    console.log(completion.choices[0]);

    const guard = await Guard.fromString(
      [await Validators.ValidLength(1, 10, "fix")],
      {
        description: "A word.",
        prompt: "Generate a single word with a length between 1 and 10.",
      }
    );

    const firstResponse = await guard.parse(
      completion.choices[0].message["content"]
    );
    console.log("first response: ", JSON.stringify(firstResponse, null, 2));
    assert.equal(firstResponse.validationPassed, true);
    assert.equal(guard.history.at(0).status, "pass");

    const completion2 = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Please generate a word with a length of between 11 and 20 characters. Do not exceed 20 characters in length. Do not include punctuation.",
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const secondResponse = await guard.parse(
      completion2.choices[0].message["content"]
    );
    console.log("second response: ", JSON.stringify(secondResponse, null, 2));
    assert.equal(secondResponse.validationPassed, true);
    assert.equal(guard.history.at(1).status, "pass");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

await main();
