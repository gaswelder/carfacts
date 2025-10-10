export const parseTable = (lines) => {
  return lines
    .map((line) => {
      if (line.startsWith("|")) {
        line = line.substring(1, line.length).trim();
      }
      if (line.endsWith("|")) {
        line = line.substring(0, line.length - 1).trim();
      }
      if (line.startsWith("-")) {
        return null;
      }
      return line.split("|").map((x) => x.trim());
    })
    .filter((x) => x != null);
};

const batch = (xs) => {
  const result = [];
  let buf = [];
  for (const x of xs) {
    buf.push(x);
    if (buf.length == 4) {
      result.push(buf);
      buf = [];
    }
  }
  if (buf.length > 0) {
    result.push(buf);
  }
  return result;
};

export const splitTable = (table) => {
  const result = [];

  const header = table[0];
  for (const rows of batch(table.slice(1))) {
    result.push([header, ...rows]);
  }

  return result;
};

export const transpose = (table) => {
  const t = Array(table[0].length);
  for (let j = 0; j < table[0].length; j++) {
    t[j] = Array(table.length);
  }
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[0].length; j++) {
      t[j][i] = table[i][j];
    }
  }
  return t;
};

export const formatTable = (table) => {
  const lines = [];
  for (const row of table) {
    lines.push("|" + row.join(" | ") + " |");
    if (lines.length == 1) {
      lines.push("|---|");
    }
  }
  return lines;
};
