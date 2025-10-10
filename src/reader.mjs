export const reader = (s) => {
  let i = 0;

  return {
    more() {
      return i < s.length;
    },
    peek() {
      return s[i];
    },
    get() {
      return s[i++];
    },
    popAnyI(...ll) {
      ll.sort((a, b) => b.length - a.length);
      const rest = s.slice(i, s.length).toLowerCase();
      for (const l of ll) {
        if (rest.startsWith(l.toLowerCase())) {
          i += l.length;
          return l;
        }
      }
      return false;
    },
    pop(c) {
      if (this.peek() == c) {
        this.get();
        return true;
      }
      return false;
    },
    digits() {
      let r = "";
      while (this.more() && this.peek().match(/\d/)) {
        r += this.get();
      }
      return r;
    },
    spaces() {
      let r = "";
      while (this.more() && this.peek() == " ") {
        r += this.get();
      }
      return r;
    },
    rest() {
      return s.slice(i);
    },
    num() {
      let a = this.digits();
      if (a == "") return "";
      if (this.pop(".")) {
        a += ".";
        a += this.digits();
      }
      return a;
    },
    id() {
      if (!this.more() || !this.peek().match(/[a-z]/i)) {
        return "";
      }
      let r = this.get();
      while (this.more() && this.peek().match(/[a-z0-9]/i)) {
        r += this.get();
      }
      return r;
    },
  };
};
