const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Department = require('./models/Department');
const User = require('./models/User');
const Paper = require('./models/Paper');
const Event = require('./models/Event');
const Achievement = require('./models/Achievement');
const fs = require('fs');
const path = require('path');

dotenv.config();

// =============================================
// REALISTIC INDIAN NAMES FOR STUDENTS
// =============================================
const maleFirstNames = [
    'Arjun', 'Rahul', 'Vikram', 'Karan', 'Rohan', 'Aditya', 'Siddharth', 'Nikhil',
    'Manish', 'Suresh', 'Deepak', 'Ravi', 'Ajay', 'Sanjay', 'Rajesh', 'Pranav',
    'Akash', 'Vishal', 'Harish', 'Prakash', 'Varun', 'Harsh', 'Mohit', 'Ankit',
    'Gaurav', 'Tarun', 'Vivek', 'Ankur', 'Piyush', 'Sachin'
];
const femaleFirstNames = [
    'Priya', 'Ananya', 'Sneha', 'Divya', 'Pooja', 'Kavya', 'Shruti', 'Neha',
    'Aarti', 'Meera', 'Swati', 'Lakshmi', 'Riya', 'Nisha', 'Sona', 'Asha',
    'Deepa', 'Sunita', 'Rekha', 'Geeta', 'Usha', 'Radha', 'Archana', 'Madhuri',
    'Poonam', 'Rashmi', 'Namrata', 'Sapna', 'Bhavna', 'Ruhi'
];
const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Reddy',
    'Nair', 'Pillai', 'Rao', 'Mishra', 'Shukla', 'Pandey', 'Tiwari', 'Iyer',
    'Menon', 'Chaudhari', 'Shah', 'Mehta', 'Malhotra', 'Kapoor', 'Khanna', 'Bose',
    'Das', 'Sinha', 'Roy', 'Mukherjee', 'Chatterjee', 'Ghosh'
];

// Pre-assigned student data: USN → {name, gender}
// Format: 1MS22<DEPT_CODE><3-digit-num>
// USN numbers used per dept: 001-005
const studentAssignments = [
    // CSE — 1MS22CSE001 to 005
    { usn: '1MS22CSE001', name: 'Arjun Sharma', gender: 'M' },
    { usn: '1MS22CSE002', name: 'Priya Verma', gender: 'F' },
    { usn: '1MS22CSE003', name: 'Vikram Patel', gender: 'M' },
    { usn: '1MS22CSE004', name: 'Ananya Singh', gender: 'F' },
    { usn: '1MS22CSE005', name: 'Rahul Kumar', gender: 'M' },
    // ECE — 1MS22ECE001 to 005
    { usn: '1MS22ECE001', name: 'Siddharth Gupta', gender: 'M' },
    { usn: '1MS22ECE002', name: 'Sneha Joshi', gender: 'F' },
    { usn: '1MS22ECE003', name: 'Karan Reddy', gender: 'M' },
    { usn: '1MS22ECE004', name: 'Divya Nair', gender: 'F' },
    { usn: '1MS22ECE005', name: 'Nikhil Pillai', gender: 'M' },
    // EEE — 1MS22EEE001 to 005
    { usn: '1MS22EEE001', name: 'Rohan Rao', gender: 'M' },
    { usn: '1MS22EEE002', name: 'Pooja Mishra', gender: 'F' },
    { usn: '1MS22EEE003', name: 'Manish Shukla', gender: 'M' },
    { usn: '1MS22EEE004', name: 'Kavya Pandey', gender: 'F' },
    { usn: '1MS22EEE005', name: 'Suresh Tiwari', gender: 'M' },
    // ME — 1MS22ME001 to 005
    { usn: '1MS22ME001', name: 'Aditya Iyer', gender: 'M' },
    { usn: '1MS22ME002', name: 'Shruti Menon', gender: 'F' },
    { usn: '1MS22ME003', name: 'Deepak Chaudhari', gender: 'M' },
    { usn: '1MS22ME004', name: 'Neha Shah', gender: 'F' },
    { usn: '1MS22ME005', name: 'Ravi Mehta', gender: 'M' },
    // CE — 1MS22CE001 to 005
    { usn: '1MS22CE001', name: 'Ajay Malhotra', gender: 'M' },
    { usn: '1MS22CE002', name: 'Aarti Kapoor', gender: 'F' },
    { usn: '1MS22CE003', name: 'Sanjay Khanna', gender: 'M' },
    { usn: '1MS22CE004', name: 'Meera Bose', gender: 'F' },
    { usn: '1MS22CE005', name: 'Rajesh Das', gender: 'M' },
    // IT — 1MS22IT001 to 005
    { usn: '1MS22IT001', name: 'Pranav Sinha', gender: 'M' },
    { usn: '1MS22IT002', name: 'Swati Roy', gender: 'F' },
    { usn: '1MS22IT003', name: 'Akash Mukherjee', gender: 'M' },
    { usn: '1MS22IT004', name: 'Lakshmi Chatterjee', gender: 'F' },
    { usn: '1MS22IT005', name: 'Vishal Ghosh', gender: 'M' },
];

// Faculty members per department
const facultyAssignments = [
    // CSE
    { name: 'Dr. Ramesh Kumar', email: 'ramesh.kumar@college.edu', dept: 'CSE', isHOD: true },
    { name: 'Prof. Sunita Sharma', email: 'sunita.sharma@college.edu', dept: 'CSE', isHOD: false, isCommittee: true },
    { name: 'Dr. Anil Verma', email: 'anil.verma@college.edu', dept: 'CSE', isHOD: false },
    // ECE
    { name: 'Dr. Pradeep Nair', email: 'pradeep.nair@college.edu', dept: 'ECE', isHOD: true },
    { name: 'Prof. Meena Pillai', email: 'meena.pillai@college.edu', dept: 'ECE', isHOD: false },
    { name: 'Dr. Suresh Rao', email: 'suresh.rao@college.edu', dept: 'ECE', isHOD: false },
    // EEE
    { name: 'Dr. Kavitha Reddy', email: 'kavitha.reddy@college.edu', dept: 'EEE', isHOD: true },
    { name: 'Prof. Harish Mishra', email: 'harish.mishra@college.edu', dept: 'EEE', isHOD: false },
    { name: 'Dr. Geeta Iyer', email: 'geeta.iyer@college.edu', dept: 'EEE', isHOD: false },
    // ME
    { name: 'Dr. Vijay Menon', email: 'vijay.menon@college.edu', dept: 'ME', isHOD: true },
    { name: 'Prof. Rekha Chaudhari', email: 'rekha.chaudhari@college.edu', dept: 'ME', isHOD: false },
    // CE
    { name: 'Dr. Rajan Shah', email: 'rajan.shah@college.edu', dept: 'CE', isHOD: true },
    { name: 'Prof. Anita Mehta', email: 'anita.mehta@college.edu', dept: 'CE', isHOD: false },
    // IT
    { name: 'Dr. Deepika Gupta', email: 'deepika.gupta@college.edu', dept: 'IT', isHOD: true },
    { name: 'Prof. Ashok Kapoor', email: 'ashok.kapoor@college.edu', dept: 'IT', isHOD: false },
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected for seeding');

        // Clear existing data
        await Department.deleteMany({});
        await User.deleteMany({});
        await Paper.deleteMany({});
        await Event.deleteMany({});
        await Achievement.deleteMany({});
        console.log('🗑️  Cleared existing data (Users, Departments, Papers, Events, Achievements)');

        const commonPassword = 'User@123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(commonPassword, salt);

        // ── 1. Create Departments ──────────────────────────────────────
        const deptDefs = [
            { code: 'CSE', name: 'Computer Science' },
            { code: 'ECE', name: 'Electronics and Communication' },
            { code: 'EEE', name: 'Electrical and Electronics' },
            { code: 'ME',  name: 'Mechanical Engineering' },
            { code: 'CE',  name: 'Civil Engineering' },
            { code: 'IT',  name: 'Information Technology' }
        ];
        const departments = await Department.insertMany(deptDefs);
        const deptMap = {}; // code → document
        departments.forEach(d => deptMap[d.code] = d);
        console.log(`✅ Created ${departments.length} departments`);

        // ── 2. Create Faculty (HODs get role='hod', committee members 'committee_member', others 'faculty') ─
        const facultyDocs = [];
        for (const fa of facultyAssignments) {
            const dept = deptMap[fa.dept];
            let role = 'faculty';
            if (fa.isHOD) {
                role = 'hod';
            } else if (fa.isCommittee) {
                role = 'committee_member';
            }
            facultyDocs.push({
                fullName: fa.name,
                email: fa.email,
                passwordHash,
                role,
                departmentId: dept._id
            });
        }
        const insertedFaculty = await User.insertMany(facultyDocs);
        console.log(`✅ Created ${insertedFaculty.length} faculty/HOD/Committee users`);

        // ── 3. Assign HODs to Departments ─────────────────────────────
        for (const fa of facultyAssignments.filter(f => f.isHOD)) {
            const hodUser = insertedFaculty.find(u => u.email === fa.email);
            const dept = deptMap[fa.dept];
            await Department.findByIdAndUpdate(dept._id, { hod: hodUser._id });
        }
        console.log('✅ HODs assigned to departments');

        // ── 4. Create Students (USN → permanent name) ──────────────────
        const studentDocs = [];
        for (const sa of studentAssignments) {
            // Derive department code from USN (e.g., 1MS22CSE001 → CSE)
            const deptCode = sa.usn.replace('1MS22', '').replace(/\d+$/, '');
            const dept = deptMap[deptCode];
            // Email based on USN for uniqueness
            const emailLocal = sa.usn.toLowerCase();
            studentDocs.push({
                fullName: sa.name,
                email: `${emailLocal}@college.edu`,
                passwordHash,
                role: 'student',
                departmentId: dept._id,
                usn: sa.usn,
                cgpa: parseFloat((7.5 + (sa.usn.charCodeAt(sa.usn.length - 1) % 25) / 10).toFixed(2)),
                skills: ['JavaScript', 'Python', 'Machine Learning']
            });
        }
        const insertedStudents = await User.insertMany(studentDocs);
        console.log(`✅ Created ${insertedStudents.length} student users`);

        // ── 5. Create System Admin ─────────────────────────────────────
        const adminPasswordHash = await bcrypt.hash('Admin@2025', salt);
        const adminUser = await User.create({
            fullName: 'System Administrator',
            email: 'admin@college.edu',
            passwordHash: adminPasswordHash,
            role: 'admin',
            departmentId: deptMap['CSE']._id
        });
        console.log('✅ Created System Administrator');

        // ── 6. Seed Research Papers ────────────────────────────────────
        const papers = [
            { title: 'Deep Learning for Medical Image Segmentation', type: 'Journal', authors: 'Arjun Sharma, Dr. Ramesh Kumar', year: 2024, dept: 'CSE', status: 'approved' },
            { title: 'IoT based Smart Irrigation System', type: 'Conference', authors: 'Siddharth Gupta', year: 2023, dept: 'ECE', status: 'approved' },
            { title: 'Energy Efficiency in Cloud Computing', type: 'Thesis', authors: 'Priya Verma', year: 2022, dept: 'CSE', status: 'approved' },
            { title: 'Renewable Energy Integration in Smart Grids', type: 'Journal', authors: 'Rohan Rao, Dr. Kavitha Reddy', year: 2025, dept: 'EEE', status: 'approved' },
            { title: 'Advanced Robotics in Manufacturing', type: 'Conference', authors: 'Aditya Iyer', year: 2023, dept: 'ME', status: 'approved' },
            { title: 'Structural Analysis of Earthquake Resistant Buildings', type: 'Journal', authors: 'Ajay Malhotra, Dr. Rajan Shah', year: 2024, dept: 'CE', status: 'approved' },
            { title: 'Blockchain for Secure Voting Systems', type: 'Thesis', authors: 'Pranav Sinha', year: 2021, dept: 'IT', status: 'approved' },
            { title: 'Natural Language Processing for Regional Languages', type: 'Conference', authors: 'Ananya Singh', year: 2025, dept: 'CSE', status: 'approved' },
            { title: '5G Antenna Design for Mobile Devices', type: 'Journal', authors: 'Sneha Joshi, Dr. Pradeep Nair', year: 2022, dept: 'ECE', status: 'approved' },
            { title: 'Electric Vehicle Battery Management Systems', type: 'Conference', authors: 'Pooja Mishra', year: 2024, dept: 'EEE', status: 'approved' },
            { title: 'Thermal Analysis of Aerospace Materials', type: 'Thesis', authors: 'Shruti Menon', year: 2023, dept: 'ME', status: 'approved' },
            { title: 'Sustainable Water Management using IoT', type: 'Journal', authors: 'Aarti Kapoor', year: 2025, dept: 'CE', status: 'approved' },
            { title: 'Cybersecurity in Smart Health Devices', type: 'Conference', authors: 'Swati Roy, Dr. Deepika Gupta', year: 2022, dept: 'IT', status: 'approved' },
            { title: 'AI-driven Malware Detection', type: 'Journal', authors: 'Vikram Patel', year: 2024, dept: 'CSE', status: 'approved' },
            { title: 'Optimization of VLSI Circuits', type: 'Thesis', authors: 'Karan Reddy', year: 2021, dept: 'ECE', status: 'approved' }
        ];

        const paperDocs = papers.map(p => {
            const student = insertedStudents.find(s => p.authors.includes(s.fullName));
            return {
                title: p.title,
                type: p.type,
                authors: p.authors,
                abstract: `This ${p.type} explores ${p.title}. It presents novel methodologies and findings in the field of ${p.dept}.`,
                year: p.year,
                departmentId: deptMap[p.dept]._id,
                submittedBy: student ? student._id : adminUser._id, // fallback to admin if student not matched
                status: p.status,
                pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // demo PDF
            };
        });
        await Paper.insertMany(paperDocs);
        console.log(`✅ Created ${paperDocs.length} approved research papers`);

        // ── 7. Seed Events ──────────────────────────────────────────────
        const eventDocs = [
            {
                userId: adminUser._id,
                title: 'National Tech Symposium 2025',
                type: 'Conference',
                organizer: 'Institute Innovation Council',
                date: new Date('2025-10-15'),
                venue: 'Main Auditorium',
                description: 'Annual gathering of tech enthusiasts and researchers.',
                status: 'approved',
                outcome: 'Participated'
            },
            {
                userId: adminUser._id,
                title: 'AI & ML Workshop',
                type: 'Workshop',
                organizer: 'CSE Department',
                date: new Date('2025-08-20'),
                venue: 'Lab 4, Block B',
                description: 'Hands-on workshop on deep learning models.',
                status: 'approved',
                outcome: 'Participated'
            },
            {
                userId: insertedStudents[0]._id, // Arjun Sharma
                title: 'Smart India Hackathon 2024',
                type: 'Hackathon',
                organizer: 'Ministry of Education',
                date: new Date('2024-12-10'),
                venue: 'Nodal Center, Delhi',
                description: 'Built an AI solution for healthcare.',
                status: 'approved',
                outcome: '1st Prize'
            }
        ];
        await Event.insertMany(eventDocs);
        console.log(`✅ Created ${eventDocs.length} events`);

        // ── 8. Seed Achievements ──────────────────────────────────────────────
        const achievementDocs = [
            {
                studentName: insertedStudents[0].fullName,
                usn: insertedStudents[0].usn,
                department: 'CSE',
                achievementTitle: 'Winner of Smart India Hackathon',
                category: 'Technical',
                description: 'Secured 1st place in the software edition of Smart India Hackathon.',
                achievementDate: new Date('2024-12-12'),
                status: 'approved',
                approvedBy: adminUser._id,
                userId: insertedStudents[0]._id,
            },
            {
                studentName: insertedStudents[1].fullName,
                usn: insertedStudents[1].usn,
                department: 'CSE',
                achievementTitle: 'State Level Badminton Champion',
                category: 'Sports',
                description: 'Won the gold medal in the inter-university badminton tournament.',
                achievementDate: new Date('2024-10-15'),
                status: 'approved',
                approvedBy: adminUser._id,
                userId: insertedStudents[1]._id,
            },
            {
                studentName: insertedStudents[2].fullName,
                usn: insertedStudents[2].usn,
                department: 'CSE',
                achievementTitle: 'Published Research Paper in IEEE',
                category: 'Research',
                description: 'Authored a paper on Machine Learning applications in healthcare.',
                achievementDate: new Date('2025-01-10'),
                status: 'pending',
                userId: insertedStudents[2]._id,
            },
            {
                studentName: insertedStudents[5].fullName,
                usn: insertedStudents[5].usn,
                department: 'ECE',
                achievementTitle: 'Best IoT Project Award',
                category: 'Technical',
                description: 'Awarded for developing an innovative smart home automation system.',
                achievementDate: new Date('2024-11-20'),
                status: 'approved',
                approvedBy: adminUser._id,
                userId: insertedStudents[5]._id,
            },
            {
                studentName: insertedStudents[6].fullName,
                usn: insertedStudents[6].usn,
                department: 'ECE',
                achievementTitle: 'Cultural Fest Organizer',
                category: 'Cultural',
                description: 'Successfully organized and managed the annual college cultural fest.',
                achievementDate: new Date('2025-02-05'),
                status: 'rejected',
                rejectionReason: 'Please upload a valid certificate of appreciation.',
                userId: insertedStudents[6]._id,
            }
        ];
        await Achievement.insertMany(achievementDocs);
        console.log(`✅ Created ${achievementDocs.length} achievements`);

        // ── 9. Export credentials to JSON ──────────────────────────────
        const credentials = {
            system_admin: {
                email: 'admin@college.edu',
                password: 'Admin@2025',
                role: 'admin',
                note: 'System-wide administrator'
            },
            hods_as_admin: facultyAssignments
                .filter(f => f.isHOD)
                .map(f => ({
                    name: f.name,
                    email: f.email,
                    password: commonPassword,
                    department: f.dept,
                    role: 'admin (HOD)'
                })),
            faculty: facultyAssignments
                .filter(f => !f.isHOD)
                .map(f => ({
                    name: f.name,
                    email: f.email,
                    password: commonPassword,
                    department: f.dept,
                    role: 'faculty'
                })),
            students: studentAssignments.map(sa => {
                const deptCode = sa.usn.replace('1MS22', '').replace(/\d+$/, '');
                return {
                    name: sa.name,
                    usn: sa.usn,
                    email: `${sa.usn.toLowerCase()}@college.edu`,
                    password: commonPassword,
                    department: deptCode,
                    role: 'student',
                    login_note: `Students can login with USN: ${sa.usn} OR email: ${sa.usn.toLowerCase()}@college.edu`
                };
            })
        };

        const outPath = path.join(__dirname, 'mock_users.json');
        fs.writeFileSync(outPath, JSON.stringify(credentials, null, 2));
        console.log(`\n📄 Credentials exported to: ${outPath}`);
        console.log('\n=========================================');
        console.log('🔑 SYSTEM ADMIN:');
        console.log('   Email:    admin@college.edu');
        console.log('   Password: Admin@2025');
        console.log('\n👨‍💼 HODs (role=admin, login by email):');
        facultyAssignments.filter(f => f.isHOD).forEach(f => {
            console.log(`   ${f.dept}: ${f.name} | ${f.email} | User@123`);
        });
        console.log('\n👩‍🏫 FACULTY (login by email):');
        facultyAssignments.filter(f => !f.isHOD).forEach(f => {
            console.log(`   ${f.dept}: ${f.name} | ${f.email} | User@123`);
        });
        console.log('\n🎓 STUDENTS (login by USN or email):');
        studentAssignments.forEach(sa => {
            console.log(`   USN: ${sa.usn} | Name: ${sa.name} | Password: User@123`);
        });
        console.log('=========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedData();
