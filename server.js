const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Endpoint for file upload
app.post('/upload', upload.single('excelFile'), (req, res) => {
    const filePath = `uploads/${req.file.filename}`;
    // Call your convert function here
    convertExcelToJson(filePath)
        .then(() => {
            res.sendStatus(200); // Send success response
        })
        .catch(err => {
            res.status(500).send('Error processing file.');
            console.error(err);
        });
});

// Convert Excel to JSON and append to existing JSON
async function convertExcelToJson(filePath) {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const teacherData = xlsx.utils.sheet_to_json(worksheet);

    // Load existing data from JSON
    let updatedData = [];
    if (fs.existsSync('teacherData.json')) {
        const existingData = JSON.parse(fs.readFileSync('teacherData.json', 'utf8'));
        updatedData = existingData; // Start with existing data
    }

    // Function to trim spaces from keys
    function trimKeys(entry) {
        return Object.fromEntries(
            Object.entries(entry).map(([key, value]) => [key.trim(), value])
        );
    }

    // Function to extract branch from section
    function getBranchFromSection(section) {
        if (!section) return "N/A"; // Handle missing or undefined sections
        return section.split('-')[0].trim(); // This gets the branch like 'CE', 'ECE', etc.
    }

    // Process each entry in the dataset
    teacherData.forEach(entry => {
        const trimmedEntry = trimKeys(entry);
        const teachers = trimmedEntry['Name of the teacher'] ? trimmedEntry['Name of the teacher'].split('/') : [];
        const empCodes = trimmedEntry['EMP Code'] ? trimmedEntry['EMP Code'].split('/') : [];

        // Determine the section and branch from section
        const section = trimmedEntry["Section"]; // Use 'Section' instead of 'Department'
        const branch = getBranchFromSection(section); // Extract branch from the section

        teachers.forEach((teacher, index) => {
            const empCode = empCodes[index] ? empCodes[index].trim() : "N/A"; // Default to "N/A" if no EMP code is available
            const newEntry = {
                "Sl. No": trimmedEntry["Sl. No"],
                "Academic Year": trimmedEntry["Academic Year"],
                "B. Tech. Year": trimmedEntry["B. Tech. Year"],
                "Sem": trimmedEntry["Sem"],
                "Section": section, // Include the section
                "Branch": branch, // Set the extracted branch
                "Name of the subject": trimmedEntry["Name of the subject"],
                "Name of the teacher": teacher.trim(),
                "EMP Code": empCode,
                "No of Students Appeared": trimmedEntry["No of Students Appeared"] || 0, // Default to 0 if not available
                "No of Students passed": trimmedEntry["No of Students passed"] || 0, // Default to 0 if not available
                "% of Pass": trimmedEntry["% of Pass"] || 0 // Default to 0 if not available
            };

            updatedData.push(newEntry);
        });
    });

    // Write the updated data back to the JSON file
    fs.writeFileSync('teacherData.json', JSON.stringify(updatedData, null, 2));
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
