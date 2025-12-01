export interface Scholar {
  id: string;
  name: string;
  specialty: string;
  description: string;
  notableFocus?: string[];
}

export const scholars: Scholar[] = [
  {
    id: 'nt-wright',
    name: 'N.T. Wright',
    specialty: 'New Testament',
    description: 'A prolific scholar known for his work on the historical Jesus and Pauline studies. His research focuses on understanding the New Testament in its first-century Jewish context.',
    notableFocus: ['Historical Jesus', 'Pauline theology', 'Second Temple Judaism', 'Resurrection studies']
  },
  {
    id: 'james-dunn',
    name: 'James Dunn',
    specialty: 'New Testament',
    description: 'A key figure in the "New Perspective on Paul" school of thought. He has made significant contributions to understanding Paul\'s letters and early Christian theology.',
    notableFocus: ['New Perspective on Paul', 'Pauline epistles', 'Early Christianity', 'Jewish-Christian relations']
  },
  {
    id: 'ep-sanders',
    name: 'E.P. Sanders',
    specialty: 'New Testament',
    description: 'A highly respected scholar who has written extensively on the historical Jesus and early Christianity. His work has significantly shaped modern Jesus scholarship.',
    notableFocus: ['Historical Jesus', 'Jewish religion', 'Early Christianity', 'Jesus and Judaism']
  },
  {
    id: 'bart-ehrman',
    name: 'Bart Ehrman',
    specialty: 'New Testament',
    description: 'An agnostic scholar known for his work on textual criticism and the historical Jesus. He brings a critical analytical approach to biblical scholarship.',
    notableFocus: ['Textual criticism', 'New Testament transmission', 'Historical Jesus', 'Early Christian literature']
  },
  {
    id: 'jd-crossan',
    name: 'John Dominic Crossan',
    specialty: 'New Testament',
    description: 'A leading figure in the historical Jesus research, often identified as a liberal Christian scholar. He employs cross-disciplinary approaches to understanding the life of Jesus.',
    notableFocus: ['Historical Jesus', 'Jesus and social movement', 'Early Christian origins', 'Cross-cultural studies']
  },
  {
    id: 'richard-bauckham',
    name: 'Richard Bauckham',
    specialty: 'New Testament',
    description: 'Respected for his work on the historical reliability of the Gospels and the book of Revelation. His research emphasizes eyewitness testimony and biblical authenticity.',
    notableFocus: ['Gospel reliability', 'Eyewitness testimony', 'Revelation studies', 'Early Christian tradition']
  },
  {
    id: 'da-carson',
    name: 'D.A. Carson',
    specialty: 'Old Testament & Broader Studies',
    description: 'An influential evangelical scholar with a wide range of work across biblical and theological studies. Known for careful exegesis and biblical integration.',
    notableFocus: ['Biblical theology', 'Gospel of John', 'Hermeneutics', 'Evangelical scholarship']
  },
  {
    id: 'walter-brueggemann',
    name: 'Walter Brueggemann',
    specialty: 'Old Testament',
    description: 'A major figure in Old Testament scholarship with groundbreaking work in prophetic theology and biblical interpretation. His approach emphasizes theological significance.',
    notableFocus: ['Old Testament theology', 'Prophetic literature', 'Covenant theology', 'Pastoral interpretation']
  },
  {
    id: 'john-bright',
    name: 'John Bright',
    specialty: 'Old Testament',
    description: 'An influential Old Testament scholar known for his archaeological work and historical approach to biblical studies. His work integrates archaeological evidence with biblical narrative.',
    notableFocus: ['Biblical archaeology', 'Old Testament history', 'Ancient Israel', 'Archaeological interpretation']
  }
];

export const scholarsBySpecialty = {
  'New Testament': scholars.filter(s => s.specialty === 'New Testament'),
  'Old Testament': scholars.filter(s => s.specialty === 'Old Testament'),
  'Broader': scholars.filter(s => s.specialty === 'Old Testament & Broader Studies')
};
