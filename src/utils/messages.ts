const typeTemplate = "'${name}' is not a validate ${type}";

export const defaultValidateMessages = {
  default: "Validation error on field '${name}'",
  required: "'${name}' is required",
  enum: "'${name}' must be one of [${enum}]",
  whitespace: "'${name}' cannot be empty",
  date: {
    format: "'${name}' date %s is invalid for format %s",
    parse: "'${name}' date could not be parsed, %s is invalid ",
    invalid: "'${name}' date %s is invalid",
  },
  types: {
    string: typeTemplate,
    method: typeTemplate,
    array: typeTemplate,
    object: typeTemplate,
    number: typeTemplate,
    date: typeTemplate,
    boolean: typeTemplate,
    integer: typeTemplate,
    float: typeTemplate,
    regexp: typeTemplate,
    email: typeTemplate,
    url: typeTemplate,
    hex: typeTemplate,
  },
  string: {
    len: "'${name}' must be exactly %s characters",
    min: "'${name}' must be at least %s characters",
    max: "'${name}' cannot be longer than %s characters",
    range: "'${name}' must be between %s and %s characters",
  },
  number: {
    len: "'${name}' must equal %s",
    min: "'${name}' cannot be less than %s",
    max: "'${name}' cannot be greater than %s",
    range: "'${name}' must be between %s and %s",
  },
  array: {
    len: "'${name}' must be exactly %s in length",
    min: "'${name}' cannot be less than %s in length",
    max: "'${name}' cannot be greater than %s in length",
    range: "'${name}' must be between %s and %s in length",
  },
  pattern: {
    mismatch: "'${name}' value %s does not match pattern %s",
  },
};
