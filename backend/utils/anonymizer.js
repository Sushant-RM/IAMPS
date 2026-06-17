const FIRST_NAMES = [
  "Aarav", "Aditya", "Amit", "Arjun", "Kabir", "Ishaan", "Rohan", "Siddharth", "Vihaan", "Yash",
  "Ananya", "Diya", "Ira", "Kavya", "Meera", "Neha", "Pooja", "Riya", "Saanvi", "Shruti",
  "Abhishek", "Deepak", "Gaurav", "Manish", "Nikhil", "Pranav", "Rajesh", "Sanjay", "Vikram", "Vivek",
  "Aishwarya", "Divya", "Komal", "Nisha", "Prisha", "Ridhi", "Sneha", "Tanya", "Aditi", "Shreya"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Kulkarni", "Joshi", "Deshmukh", "Patil", "Reddy", "Nair", "Iyer",
  "Mehta", "Shah", "Kumar", "Singh", "Mishra", "Pandey", "Choudhury", "Bose", "Sen", "Das",
  "Rao", "Jadhav", "Sinha", "Prasad", "Roy", "Banerjee", "Dubey", "Trivedi", "Patel", "Goyal"
];

/**
 * Deterministically anonymizes student/mock names (e.g., "Student CSE 1") 
 * into realistic names based on email hashes. Fictional names remain fixed 
 * per user, and new users automatically get a deterministic name mapping.
 */
function anonymizeName(email, originalName) {
  if (!email) return originalName || "Student";
  
  const nameLower = (originalName || "").toLowerCase();
  const isStudent = nameLower.startsWith("student") || email.toLowerCase().includes("student");
  
  if (!isStudent) {
    return originalName;
  }

  // Generate a simple deterministic hash of the email string
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  hash = Math.abs(hash);

  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[(hash >> 3) % LAST_NAMES.length];
  
  return `${first} ${last}`;
}

module.exports = {
  anonymizeName
};
