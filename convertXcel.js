const XLSX = require('xlsx');
const fs = require('fs');

// Load the Excel file
const workbook = XLSX.readFile('teachers_data2.xlsx');

// Convert the first sheet to JSON
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const teacherData = XLSX.utils.sheet_to_json(worksheet);

// Process each entry in the dataset
let updatedData = [];

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

// Write the updated data to a JSON file
fs.writeFileSync('updated_teachers.json', JSON.stringify(updatedData, null, 2));

console.log("JSON file saved as 'updated_teachers.json'");
