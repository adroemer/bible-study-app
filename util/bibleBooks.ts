import type { BibleBook } from '../types';

export const chronologicalBooks: BibleBook[] = [
    { name: "Genesis", testament: "OT" }, { name: "Exodus", testament: "OT" }, { name: "Leviticus", testament: "OT" },
    { name: "Numbers", testament: "OT" }, { name: "Deuteronomy", testament: "OT" }, { name: "Joshua", testament: "OT" },
    { name: "Judges", testament: "OT" }, { name: "Ruth", testament: "OT" }, { name: "1 Samuel", testament: "OT" },
    { name: "2 Samuel", testament: "OT" }, { name: "1 Kings", testament: "OT" }, { name: "2 Kings", testament: "OT" },
    { name: "1 Chronicles", testament: "OT" }, { name: "2 Chronicles", testament: "OT" }, { name: "Ezra", testament: "OT" },
    { name: "Nehemiah", testament: "OT" }, { name: "Esther", testament: "OT" }, { name: "Job", testament: "OT" },
    { name: "Psalms", testament: "OT" }, { name: "Proverbs", testament: "OT" }, { name: "Ecclesiastes", testament: "OT" },
    { name: "Song of Solomon", testament: "OT" }, { name: "Isaiah", testament: "OT" }, { name: "Jeremiah", testament: "OT" },
    { name: "Lamentations", testament: "OT" }, { name: "Ezekiel", testament: "OT" }, { name: "Daniel", testament: "OT" },
    { name: "Hosea", testament: "OT" }, { name: "Joel", testament: "OT" }, { name: "Amos", testament: "OT" },
    { name: "Obadiah", testament: "OT" }, { name: "Jonah", testament: "OT" }, { name: "Micah", testament: "OT" },
    { name: "Nahum", testament: "OT" }, { name: "Habakkuk", testament: "OT" }, { name: "Zephaniah", testament: "OT" },
    { name: "Haggai", testament: "OT" }, { name: "Zechariah", testament: "OT" }, { name: "Malachi", testament: "OT" },
    { name: "Matthew", testament: "NT" }, { name: "Mark", testament: "NT" }, { name: "Luke", testament: "NT" },
    { name: "John", testament: "NT" }, { name: "Acts", testament: "NT" }, { name: "Romans", testament: "NT" },
    { name: "1 Corinthians", testament: "NT" }, { name: "2 Corinthians", testament: "NT" }, { name: "Galatians", testament: "NT" },
    { name: "Ephesians", testament: "NT" }, { name: "Philippians", testament: "NT" }, { name: "Colossians", testament: "NT" },
    { name: "1 Thessalonians", testament: "NT" }, { name: "2 Thessalonians", testament: "NT" }, { name: "1 Timothy", testament: "NT" },
    { name: "2 Timothy", testament: "NT" }, { name: "Titus", testament: "NT" }, { name: "Philemon", testament: "NT" },
    { name: "Hebrews", testament: "NT" }, { name: "James", testament: "NT" }, { name: "1 Peter", testament: "NT" },
    { name: "2 Peter", testament: "NT" }, { name: "1 John", testament: "NT" }, { name: "2 John", testament: "NT" },
    { name: "3 John", testament: "NT" }, { name: "Jude", testament: "NT" }, { name: "Revelation", testament: "NT" }
];

export const alphabeticalBooks: BibleBook[] = [...chronologicalBooks].sort((a, b) => a.name.localeCompare(b.name));
