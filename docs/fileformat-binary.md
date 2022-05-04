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
   1. A list of IDs of all modules that are the tails of the incoming edges of
      a control flow graph:

      1. One-byte unsigned integer count of list items
      2. A sequence of two-byte block identifiers

      Each ID must either exist inside the module or be equal to 0xffff to
      denote transition to/from a host.


   2. A two-level list of borrowed local values grouped by incoming modules.
      Each top-level list item maps to a local value of the current block;
      each second-level item describes a borrowed value for each incoming
      module.

      1. One-byte unsigned integer total count of list items (number of new
         local values times a number of the incoming block)
      2. A sequence of one-byte local value identifiers. The incoming module
         order is the same as in the 2.1

   3. A list of 32-bit signed integers mapped to `integer` data type of the VM.

      1. One-byte unsigned integer total count of list items
      2. A sequence of four-byte native-endian signed numbers

      64-bit numbers may be assembled from two 32-bit ones, since they are too
      rare to be stored literally.

   4. A list of IEEE 754-2008 binary64 real numbers mapped to `real` data type
     of the VM.

      1. One-byte unsigned integer total count of list items
      2. A sequence of eigth-byte native-endian byte sequences

   4. A list of arbitrary basic block IDs references to which are put into local
      values and may be someday used to specify a node exit edge.

      1. One-byte unsigned integer total count of list items
      2. A sequence of two-byte native-endian unsigned numbers

      Each ID must either exist inside the module or be equal to 0xffff to
      denote transition to/from a host.

   5. A list of prefilled copy-on-write octet (byte) lists.

      1. One-byte unsigned integer total count of list items
      2. Each item is a list itself:
         1. One-byte unsigned integer total count of octets in the octet list
         2. A sequence of octets

   6. A list of expressions:

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
            - 0x09: set
            - 0x0a: set_u8
            - 0x0b: set_s8
            - 0x0c: set_u16
            - 0x0d: set_s16
            - 0x0e: set_u32
            - 0x0f: set_s32
            - 0x10: set_s64
            - 0x11: set_real
            - 0x12: size
            - 0x13: type
            - 0x14: add
            - 0x15: mul
            - 0x16: reciprocal
            - 0x17: and
            - 0x18: or
            - 0x19: xor
            - 0x1a: lsh
            - 0x1b: eq

         2. One byte of local register ID for the first input
         3. One byte of local register ID for the second input
         4. One byte of local register ID for the third input

   7. One byte local register ID used as a boolean choice between two exit edges
      of the block
   8. One byte local register ID used as a "trueish" node head
   9. One byte local register ID used as a "falsish" node head.
