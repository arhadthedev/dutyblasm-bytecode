## Bytecode and Execution Model

Dutyblasm virtual machine is:

- SSA form register-based, expression-oriented (value | `undefined`)

  - code is represented as a directed control flow graph of linear basic blocks,
    each having a boolean condition specifying which of two exit edges to be
    taken

  - the basic block maintains a collection of local values accessible inside
    the block only

  - the block at the tail of the edge can pass some of its values to the block
    as the head of the edge. The head, in its turn, can use them for
    computations or passing further

- with dynamic inferred structural type system (dictionary | octet-list |
  integer | real | code-block-reference | undefined)

  - *dictionary* is an unordered set of (*string* → *value*) items

  - integer, real and code-block-reference values are immutable
  - dictionary and octet-list values are mutable
  - undefined is a unit type so mutability does not apply

- with no side effects of basic blocks

  - each block can be optimized into a plain dictionary of (*borrowed-values* →
    *new-local-values*) items

  - stack and global variables are maintaned manually as ordinary dictionaries
    borrowed from one basic block to another

  - the only way of communication between the bytecode and the virtual machine
    is a transition to/from a dedicated control flow graph node:

    - transition into the node stops the bytecode execution, borrows all local
      values of the edge tail and returns to the virtual machine user so they
      can use the values

      *Note:* to help an optimizer to determine what values are not required by
      the host so may be optimized out, a two-step trampoline nodes may be used.
      The first node is used to unwrap dictionary fields into local values, and
      the second node is used to borrow only necessary values avoiding anything
      not required for a host in its local values.

    - when the machine resumes, the transition from the node is done with
      local values and the edge head supplied by a user of the virtual machine.

      *Note:* to help an optimizer a type dictionary (*edge-head* → *domains
      of local values*) may be supplied.

### Data types

Dutyblasm virtual machine supports the following data types:

- dictionary
- octet-list: a list (one-directional array) of individual octets
  (8-bit bytes) with free type interpretation.
- integer: 64-bit signed integer
- real: 64-bit IEEE 754-2008 binary64 real number
- code-block-reference
- undefined: a distinct unit type; can be obtained by accessing not-yet-existing
  value

### Expressions

Each expression can have up to three arguments that can be either outputs of
other expressions or borrowed values.

| Name | in1 | in2 | in3 | out |
| --- | --- | --- | --- | --- |
| get | dictionary | octet-list | ignored | `in1.in2` |
| | | integer | ignored | `in1.%specials%.in2` |
| get_u8 | octet-list | integer | ignored | 8-bit signed `integer` from `in1[in2]` |
| get_s8 | octet-list | integer | ignored | 8-bit unsigned `integer` from `in1[in2]` |
| get_u16 | octet-list | integer | ignored | 16-bit signed `integer` in native endianness starting with `in1[in2]` |
| get_s16 | octet-list | integer | ignored | 16-bit unsigned `integer` in native endianness starting with `in1[in2]` |
| get_u32 | octet-list | integer | ignored | 32-bit signed `integer` in native endianness starting with `in1[in2]` |
| get_s32 | octet-list | integer | ignored | 32-bit unsigned `integer` in native endianness starting with `in1[in2]` |
| get_s64 | octet-list | integer | ignored | 64-bit signed `integer` in native endianness starting with `in1[in2]` |
| get_real | octet-list | integer | ignored | 64-bit IEEE 754 binary64 `real` starting with `in1[in2]` |
| set | dictionary | octet-list | any | `undefined` performing `in1.in2 = in3` beforehand  |
| | | integer | any | `undefined` performing `in1.%specials%.in2 = in3` beforehand |
| set_u8 | octet-list | integer | any | `undefined` performing `in1[in2] = (u8)in3` beforehand |
| set_s8 | octet-list | integer | any | `undefined` performing `in1[in2] = (s8)in3` beforehand |
| set_u16 | octet-list | integer | any | `undefined` performing `in1[in2:in2+1] = (u16)in3` beforehand |
| set_s16 | octet-list | integer | any | `undefined` performing `in1[in2:in2+1] = (s16)in3` beforehand |
| set_u32 | octet-list | integer | any | `undefined` performing `in1[in2:in2+3] = (u32)in3` beforehand |
| set_s32 | octet-list | integer | any | `undefined` performing `in1[in2:in2+3] = (s32)in3` beforehand |
| set_s64 | octet-list | integer | any | `undefined` performing `in1[in2:in2+7] = (u64)in3` beforehand |
| set_real | octet-list | integer | any | `undefined` performing `in1[in2:in2+7] = (double)in3` beforehand |
| size | dictionary | ignored | ignored | count of non-special items |
| | octet-list | ignored | ignored | count of octets (bytes) |
| type | undefined | ignored | ignored | 0 |
| | dictionary | ignored | ignored | 1 |
| | octet-list | ignored | ignored | 2 |
| | integer | ignored | ignored | 3 |
| | real | ignored | ignored | 4 |
| | code-block-reference | ignored | ignored | 5 |
| add | integer | integer | ignored | exact `in1 + in2` |
| mul | integer \| real | integer \| real | ignored | IEEE 754-2008 `in1 + in2` |
| reciprocal | integer \| real | ignored | ignored | IEEE 754-2008 `1.0 / in2` |
| and | integer | integer | ignored | bitwise `in1 & in2` |
| | integer \| real | integer \| real | ignored | bitwise `trunc(in1) & trunc(in2)` |
| or | integer | integer | ignored | bitwise `in1 \| in2` |
| | integer \| real | integer \| real | ignored | bitwise `trunc(in1) \| trunc(in2)` |
| xor | integer | integer | ignored | bitwise `in1 ^ in2` |
| | integer \| real | integer \| real | ignored | bitwise `trunc(in1) ^ trunc(in2)` |
| lsh | integer | integer | ignored | bitwise `in1 << in2` |
| | integer \| real | integer \| real | ignored | bitwise `trunc(in1) << trunc(in2)` |
| eq | dictionary | dictionary | ignored | a maximum value of an `integer` if in1 and in2 are the same object, 0 otherwise |
| | octet-list | octet-list | ignored | a maximum value of an `integer` if in1 and in2  are the same object, 0 otherwise |
| | integer | integer | ignored | a maximum value of an `integer` if in1 and in2 are the same value, 0 otherwise |
| | real | real | ignored | a maximum value of an `integer` if in1 is equal to in2 (taking IEEE 754-2008 *6.2.3 NaN propagation* into account), 0 otherwise |
| | any | any | ignored | 0 for any other combination |

The following corner cases set `out` to undefined:

- any combination of inputs not described above
- full or partial access outside an octet list
- access to a local value or a dictionary key not yet.

Any other case stops the virtual machine returning its user an error.
