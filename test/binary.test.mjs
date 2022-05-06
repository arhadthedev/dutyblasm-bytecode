/**
 * @file Unit tests for ../src/binary.mts
 * @copyright © 2022 Oleg Iarygin <oleg@arhadthedev.net>
 * @license MIT
 */

import {Opcodes, build} from "dutyblasm-bytecode/binary";
import {Numseq} from "numseq";
import {readFile} from "node:fs/promises";

/** Get unique per-field values to catch swapped fields and wrong int types. */
function getArray(sequence) {
    const maxArrayLength = 3;
    const avoid0 = 1;
    const wraparound = 256;
    const arraySize = sequence.next() % maxArrayLength;
    const counter = Array(arraySize + avoid0).keys();
    return Array.from(counter, () => sequence.next() % wraparound);
}

function generateCommands(sequence) {
    const wraparound = 256;
    return Object.keys(Opcodes).filter(value => !isNaN(value)).
        map(code => [
            code,
            sequence.next() % wraparound,
            sequence.next() % wraparound,
            sequence.next() % wraparound
        ]);
}

describe("binary serializer", () => {

    function getInput() {
        const uniqueNumbers = Numseq;
        const getUniqueArray = getArray.bind(null, uniqueNumbers);
        return [
            {
                blocks: [],
                byteLists: [],
                callerValues: [],
                callers: [],
                commands: [],
                dictionaryCount: [],
                integers: [],
                leavingCondition: [],
                leavingFailureTarget: [],
                leavingSuccessTarget: [],
                reals: []
            },
            {
                blocks: getUniqueArray(),
                byteLists: ["foo", "bar"],
                callerValues: getUniqueArray(),
                callers: getUniqueArray(),
                commands: generateCommands(uniqueNumbers),
                dictionaryCount: getUniqueArray(),
                integers: getUniqueArray(),
                leavingCondition: uniqueNumbers.next(),
                leavingFailureTarget: uniqueNumbers.next(),
                leavingSuccessTarget: uniqueNumbers.next(),
                reals: getUniqueArray()
            }
        ];
    }

    it("full structure", async() => {
        expect.hasAssertions();
        const referenceUrl = new URL("reference-mini.bin", import.meta.url);
        const reference = new Uint8Array(await readFile(referenceUrl));
        const serialized = build(getInput());
        expect(serialized.toString()).toBe(reference.toString());
    });

});
