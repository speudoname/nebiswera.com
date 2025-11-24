// Filter out AI course testimonials
const fs = require('fs');

const aiCourseNames = [
  'Ekaterina Shavgulidze',
  'ეკატერინდ',
  'თეა',
  'მაკა შავგულიძე',
  'ნინო გ',
  'ერეკლე',
  'ნინა',
  'მარიამ ვარდოსანიძე',
  'Teona Makalatia',
  'ლაშა ჭიტაძე'
];

const data = JSON.parse(fs.readFileSync('all-testimonials.json', 'utf8'));

const filtered = data.testimonials.filter(t => {
  // Check if name matches any AI course participant
  const isAICourse = aiCourseNames.some(name =>
    t.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(t.name.toLowerCase())
  );

  // Also check if text mentions AI course
  const hasAIKeywords = t.text && (
    t.text.includes('AI კურსი') ||
    t.text.includes('AI-ის') ||
    t.text.includes('ხელოვნური ინტელექტი') ||
    t.text.includes('AI აკადემია')
  );

  return !isAICourse && !hasAIKeywords;
});

const output = {
  metadata: {
    ...data.metadata,
    total_count: filtered.length,
    notes: "Nebiswera program testimonials only (AI course testimonials removed)"
  },
  testimonials: filtered
};

fs.writeFileSync('testimonials-cleaned.json', JSON.stringify(output, null, 2));

console.log(`Original: ${data.testimonials.length} testimonials`);
console.log(`Filtered: ${filtered.length} testimonials`);
console.log(`Removed: ${data.testimonials.length - filtered.length} AI course testimonials`);
