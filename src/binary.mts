/**
 * @file Convert bytecode modules between binary and editable representations.
 * @copyright © 2022 Oleg Iarygin <oleg@arhadthedev.net>
 * @license MIT
 */

import type {ReadonlyDeep, TypedArray} from "type-fest";
import {concat} from "uint8arrays/concat";

export enum Opcodes {
    get = 0x00,
    getU8 = 0x01,
    getUS8 = 0x02,
    getU16 = 0x03,
    getS16 = 0x04,
    getU32 = 0x05,
    getS32 = 0x06,
    getS64 = 0x07,
    getReal = 0x08,
    set = 0x10,
    setU8 = 0x11,
    setS8 = 0x12,
    setU16 = 0x13,
    setS16 = 0x14,
    setU32 = 0x15,
    setS32 = 0x16,
    setS64 = 0x17,
    setReal = 0x18,
    size = 0x20,
    type = 0x30,
    add = 0x40,
    mul = 0x50,
    reciprocal = 0x60,
    and = 0x70,
    or = 0x80,
    xor = 0x90,
    lsh = 0xa0,
    eq = 0xb0
}

/**
 * "DBBC" in little endian.
 *
 * Up to four bits can be encoded by four uppercale/lowercase letters.
 * Initial idea is to use them to mark a major format version 1-16.
 */
const signature = 0x43424244;

export interface LinearBlock {
    integers: number[];
    reals: number[];
    blocks: number[];
    byteLists: string[];
    dictionaryCount: number;

    commands: [number, number, number, number][];

    nextTargetCondition: number;
    nextTrueishTarget: number;
    nextFalsishTarget: number;
    nextTrueishTargetInitialValues: number[];
    nextFalsishTargetInitialValues: number[];
}

/**
 * Turn a loose sequnce of editable arrays into a continuous binary ready to be
 * written to a file.
 *
 * @param deserialized A source used to build the binary.
 * @returns A TypedArray with the final binary.
 */
export function build(deserialized: ReadonlyDeep<LinearBlock[]>): Uint8Array {
    const serializeArray = (values: ReadonlyDeep<TypedArray>): TypedArray[] => [
        new Uint8Array([values.length]),
        values
    ];
    const serializeStrings = (values: readonly string[]): Uint8Array[] => [
        new Uint8Array([values.length]),
        new Uint8Array(values.map(value => value.length)),
        new TextEncoder().encode(values.join(""))
    ];
    const serializeCommands = (commands: readonly (readonly [number, number,
        number, number])[]): Uint8Array => new Uint8Array([
        commands.length,
        ...commands.flat()
    ]);

    const blocks = deserialized.flatMap(block => [
        ...serializeArray(new Int32Array(block.integers)),
        ...serializeArray(new Float64Array(block.reals)),
        ...serializeArray(new Uint16Array(block.blocks)),
        ...serializeStrings(block.byteLists),
        new Uint8Array([block.dictionaryCount]),
        serializeCommands(block.commands),
        new Uint8Array([
            block.nextTargetCondition,
            block.nextTrueishTarget,
            block.nextFalsishTarget
        ]),
        ...serializeArray(new Uint8Array(block.nextTrueishTargetInitialValues)),
        ...serializeArray(new Uint8Array(block.nextFalsishTargetInitialValues))
    ]);
    const binary = [
        new Uint32Array([signature]),
        ...blocks
    ].map((chunk: ReadonlyDeep<TypedArray>) => new Uint8Array(chunk.buffer));
    return concat(binary);
}
