## Bytecode module binary format

*See [Bytecode and Execution Model](bytecode.md) for the terms and context.*

A Dutyblasm bytecode module is a sequence of the following fields:

1. File signature. Encodes endianness of further fields and a version:

   - `DBBC` for little-endian modules, `CBBD` for big-endian modules
   - a major SemVer version is denoted by case of each letter, most significant
     bit first. The current version is 0 (`DBBC`).

2. A list of basic blocks identified by their sequence number. The list spans
   until the end of a stream. Each list entry has a variable size and the
   following structure:

   1. A list of 32-bit signed integers mapped to `integer` data type of the VM.

      1. One-byte unsigned integer total count of list items
      2. A sequence of four-byte native-endian signed numbers

      64-bit numbers may be assembled from two 32-bit ones, since they are too
      rare to be stored literally.

   1. A list of IEEE 754-2008 binary64 real numbers mapped to `real` data type
     of the VM.

      1. One-byte unsigned integer total count of list items
      2. A sequence of eigth-byte native-endian byte sequences

   1. A list of arbitrary basic block IDs references to which are put into local
      values and may be someday used to specify a node exit edge.

      1. One-byte unsigned integer total count of list items
      2. A sequence of two-byte native-endian unsigned numbers

      Each ID must either exist inside the module or be equal to 0xffff to
      denote transition to/from a host.

   1. A list of prefilled copy-on-write octet (byte) lists.

      1. One-byte unsigned integer total count of list items
      2. Each item is a list itself:
         1. One-byte unsigned integer total count of octets in the octet list
         2. A sequence of octets

   1. A one-byte count of new empty dictionary items that need to be allocated.

   1. A list of expressions:

      1. One-byte unsigned integer total count of expressions for a block
      2. A sequence of four-field tuples:
         1. One-byte opcode, on of the following:

            - 0x00: get
            - 0x01: get_u8
            - 0x02: get_s8
            - 0x03: get_u16
            - 0x04: get_s16
            - 0x05: get_u32
            - 0x06: get_s32
            - 0x07: get_s64
            - 0x08: get_real
            - 0x10: set
            - 0x11: set_u8
            - 0x12: set_s8
            - 0x13: set_u16
            - 0x14: set_s16
            - 0x15: set_u32
            - 0x16: set_s32
            - 0x17: set_s64
            - 0x18: set_real
            - 0x20: size
            - 0x30: type
            - 0x40: add
            - 0x50: mul
            - 0x60: reciprocal
            - 0x70: and
            - 0x80: or
            - 0x90: xor
            - 0xa0: lsh
            - 0xb0: eq

             In general, an opcode consists of two independend nibbles (4-bit
             parts). The higher part is a group and the higher part is a
             variant. Such a design allows to fill an opcode table with all 16
             variants of the groups thus avoiding bound checking.

         2. One byte of local register ID for the first input
         3. One byte of local register ID for the second input
         4. One byte of local register ID for the third input

   1. One byte local register ID used as a boolean choice between two exit edges
      of the block

   1. One byte local register ID used as a "trueish" node head

   1. One byte local register ID used as a "falsish" node head

   1. A list of values used to prepopulate first N registers before
      transitioning to a "trueish" node:

      1. One-byte unsigned integer total count of the values transferred
      2. A sequence of one-byte current block registers IDs used for the
         transfer

   1. A list of values used to prepopulate first N registers before
      transitioning to a "falseish" node.

      1. One-byte unsigned integer total count of the values transferred
      2. A sequence of one-byte current block registers IDs used for the
         transfer
