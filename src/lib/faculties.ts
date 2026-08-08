// UNIOSUN faculties and departments, flattened from the college structure —
// eligibility only cares about faculty/department, not which college they sit under.
export const FACULTIES: { name: string; departments: string[] }[] = [
  {
    name: "Faculty of Agricultural Production and Management",
    departments: [
      "Agricultural Economics and Agribusiness Management",
      "Agricultural Extension and Rural Development",
      "Agronomy",
      "Animal Science",
    ],
  },
  {
    name: "Faculty of Renewable Natural Resources Management",
    departments: [
      "Fisheries and Aquatic Resources Management",
      "Wildlife and Ecotourism Management",
      "Forestry Resource Management",
    ],
  },
  {
    name: "Faculty of Education",
    departments: [
      "Adult and Continuing Education",
      "Educational Management",
      "Guidance and Counselling",
      "Business Education",
      "Environmental Education",
      "Science, Technology and Mathematics Education",
      "Arts and Social Science Education",
      "Educational Technology",
    ],
  },
  {
    name: "Faculty of Basic Medical Sciences",
    departments: ["Anatomy", "Human Nutrition and Dietetics", "Medical Biochemistry", "Medical Laboratory Science", "Physiology"],
  },
  {
    name: "Faculty of Basic Clinical Sciences",
    departments: [
      "Chemical Pathology",
      "Haematology and Blood Transfusion",
      "Medical Microbiology and Parasitology",
      "Morbid Anatomy and Histopathology",
      "Pharmacology",
    ],
  },
  {
    name: "Faculty of Clinical Sciences",
    departments: ["Community Medicine", "Medicine", "Obstetrics and Gynaecology", "Ophthalmology", "Paediatrics", "Psychiatry", "Surgery"],
  },
  {
    name: "Faculty of Nursing Sciences",
    departments: [
      "Nursing Education, Research and Informatic Nursing",
      "Maternity and Child Health Nursing",
      "Medical-Surgical Nursing",
      "Mental Health and Psychiatric Nursing",
      "Public/Community Health Nursing",
    ],
  },
  {
    name: "Faculty of Basic and Applied Sciences",
    departments: [
      "Animal and Environmental Biology",
      "Biochemistry",
      "Biotechnology",
      "Food Science and Technology",
      "Geology",
      "Mathematical Sciences",
      "Microbiology",
      "Plant Biology",
      "Pure and Applied Chemistry",
      "Physics with Electronics",
      "Science Laboratory Technology",
      "Statistics",
    ],
  },
  {
    name: "Faculty of Computing and Information Technology",
    departments: [
      "Computer Science",
      "Cyber Security",
      "Data Science",
      "Information Systems",
      "Information Technology",
      "Library and Information Science",
      "Software Engineering",
    ],
  },
  {
    name: "Faculty of Engineering",
    departments: [
      "Agricultural Engineering",
      "Chemical Engineering",
      "Civil Engineering",
      "Computer Engineering",
      "Electrical/Electronics Engineering",
      "Mechanical Engineering",
      "Mechatronics Engineering",
    ],
  },
  {
    name: "Faculty of Environmental Sciences",
    departments: ["Architecture", "Building", "Estate Management", "Quantity Surveying", "Urban and Regional Planning"],
  },
  {
    name: "Faculty of Liberal Studies",
    departments: ["Criminology and Security Studies", "Peace and Conflict Studies"],
  },
  {
    name: "Faculty of Law",
    departments: ["Business and Private Law", "Common and Islamic Law", "Public and International Law"],
  },
  {
    name: "Faculty of Management Sciences",
    departments: [
      "Accounting",
      "Banking and Finance",
      "Business Administration",
      "Cooperative and Rural Development",
      "Marketing",
      "Entrepreneurial Studies",
      "Human Resource Development",
      "Employment Relation and Human Resource",
      "Public Administration",
    ],
  },
  {
    name: "Faculty of Social Sciences",
    departments: [
      "Demography and Social Statistics",
      "Economics",
      "Geography",
      "International Relations and Diplomacy",
      "Political Science",
      "Psychology",
      "Social Work",
      "Sociology",
    ],
  },
  {
    name: "Faculty of Culture",
    departments: ["Linguistics and Communication Studies", "Yoruba", "Theatre Arts", "Tourism"],
  },
  {
    name: "Faculty of Humanities",
    departments: [
      "English and Literary Studies",
      "French and International Studies",
      "History and International Studies",
      "Arabic Language and Literature Studies",
    ],
  },
];

export function departmentsForFaculty(facultyName: string): string[] {
  return FACULTIES.find((f) => f.name === facultyName)?.departments ?? [];
}
