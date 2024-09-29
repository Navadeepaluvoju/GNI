// Function to normalize text for comparison (helps in ignoring case and spaces)
function normalizeText(text) {
    return text ? text.toLowerCase().replace(/\s+/g, '') : '';
}



// Function to calculate average pass percentage for a specific subject and year
function calculateAveragePass(teacherData, subject, currentYear, yearsAgo) {
    const yearParts = currentYear.split('-').map(part => parseInt(part));
    const yearToCheck = (yearParts[0] - yearsAgo) + '-' + (yearParts[1] - yearsAgo);
    const branch = subject['Branch'];
    const section = subject['Section'];
    const bTechYear = subject['B. Tech. Year'];
    const sem = subject['Sem'];
    const subjectName = normalizeText(subject['Name of the subject']);

    // Create a Set to track unique combinations of section and subject
    const uniqueEntries = new Set();
    
    // Initialize sums for passed and appeared students
    let totalPassed = 0;
    let totalAppeared = 0;

    // Filter records for the specified year, branch, B. Tech. year, and semester
    const subjectsForYear = teacherData.filter(t =>
        t['Academic Year'] === yearToCheck &&
        t['Branch'] === branch &&
        t['B. Tech. Year'] === bTechYear &&
        t['Sem'] === sem &&
        normalizeText(t['Name of the subject']) === subjectName
    );

    // Calculate the total number of students passed and appeared considering unique entries
    subjectsForYear.forEach(t => {
        const uniqueKey = `${t['Section']}-${normalizeText(t['Name of the subject'])}`;

        if (!uniqueEntries.has(uniqueKey)) {
            uniqueEntries.add(uniqueKey);
            totalPassed += parseInt(t['No of Students passed']) || 0;
            totalAppeared += parseInt(t['No of Students Appeared']) || 0;
        }
    });

    // Calculate average pass percentage
    if (totalAppeared > 0) {
        const averagePassPercentage = (totalPassed / totalAppeared) * 100;
        return averagePassPercentage.toFixed(2); // Return average formatted to two decimal places
    } else {
        return 'N/A'; // Return 'N/A' if no students appeared
    }
}

function calculateSectionAverage(teacherData, academicYear, bTechYear, sem, section) {
    // Filter data for the specified academic year, B. Tech. year, semester, and section
    const relevantSubjects = teacherData.filter(t => 
        t['Academic Year'] === academicYear &&
        t['B. Tech. Year'] === bTechYear &&
        t['Sem'] === sem &&
        t['Section'] === section &&
        !/lab|laboratory/i.test(t['Name of the subject']) // Exclude lab subjects
    );

    // Initialize totals for passed and appeared students
    let totalPassed = 0;
    let totalAppeared = 0;

    // Set to track unique subject-section combinations
    const uniqueSubjects = new Set();

    // Loop through all subjects for the given section and aggregate total passed and appeared
    relevantSubjects.forEach(sub => {
        // Create a unique key for the subject (based on B. Tech. Year, Sem, Section, and Subject Name)
        const uniqueKey = `${sub['B. Tech. Year']}-${sub['Sem']}-${sub['Section']}-${normalizeText(sub['Name of the subject'])}`;

        // Only add to totals if the subject is unique
        if (!uniqueSubjects.has(uniqueKey)) {
            uniqueSubjects.add(uniqueKey); // Add this subject to the Set
            totalPassed += parseInt(sub['No of Students passed']) || 0;
            totalAppeared += parseInt(sub['No of Students Appeared']) || 0;
        }
    });

    // Calculate the overall section pass percentage across all theory subjects
    if (totalAppeared > 0) {
        return (totalPassed / totalAppeared * 100).toFixed(2); // Return percentage formatted to 2 decimal places
    } else {
        return 'N/A'; // Return 'N/A' if no students appeared
    }
}



// Fetching the teacher data from the JSON file
fetch('teacherData.json')
    .then(response => response.json())
    .then(teacherData => {
        const form = document.getElementById('teacherForm');
        const resultDiv = document.getElementById('result');
        const printButton = document.getElementById('printButton');

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Retrieve form values
            const empCode = document.getElementById('empCode').value.trim();
            const department = document.getElementById('department').value.trim();
            const designation = document.getElementById('designation').value.trim();
            const subjectType = document.getElementById('subjectType').value; // 'theory' or 'lab'

            // Validate subject type selection
            if (!subjectType) {
                alert('Please select a Subject Type (Theory or Lab).');
                return;
            }

            const normalizedEmpCode = empCode.replace(/\s+/g, '');

            // Filter teacher details based on EMP Code
            const teacherDetails = teacherData.filter(t => {
                return (normalizedEmpCode === '' || t['EMP Code'].replace(/\s+/g, '') === normalizedEmpCode);
            });

            if (teacherDetails.length > 0) {
                const firstTeacher = teacherDetails[0];
                const teacherName = firstTeacher['Name of the teacher'] || 'Not Available';
                const dept = department || 'Not Provided';
                const empId = firstTeacher['EMP Code'] ? firstTeacher['EMP Code'].replace(/\s+/g, '') : 'Not Available';
                const designationValue = designation || 'Not Provided';

                // Separate lab subjects and lecture subjects based on dropdown selection
                let selectedSubjects;
                let subjectTitle;
                if (subjectType === 'lab') {
                    selectedSubjects = teacherDetails.filter(teacher => /lab|laboratory/i.test(teacher['Name of the subject']));
                    subjectTitle = "Lab Subjects";
                } else {
                    selectedSubjects = teacherDetails.filter(teacher => !/lab|laboratory/i.test(teacher['Name of the subject']));
                    subjectTitle = "Theory Subjects";
                }

                // Initialize the output HTML with teacher details
                let outputHtml = `<h2>Faculty Name: ${teacherName}</h2>
                                  <h2>Department: ${dept}</h2>
                                  <h2>Designation: ${designationValue}</h2>
                                  <h2>Employee ID: ${empId}</h2>`;

                if (subjectType === 'theory') {
                    // For Theory, include average pass percentages over the last 5 years
                    // Get unique academic years, sort them in descending order, and select the last 5
                    const academicYears = [...new Set(selectedSubjects.map(t => t['Academic Year']))]
                        .sort((a, b) => parseInt(b.split('-')[0]) - parseInt(a.split('-')[0])) // Sort by year in descending order
                        .slice(0, 5); // Take the most recent 5 years

                    // Loop through each academic year and create a table
                    academicYears.forEach(year => {
                        const yearSubjects = selectedSubjects.filter(t => t['Academic Year'] === year);

                        if (yearSubjects.length > 0) {
                            // Determine the academic years for the past 4 years
                            const pastYears = [];
                            for (let i = 0; i < 5; i++) {
                                const pastYear = (parseInt(year.split('-')[0]) - i) + '-' + (parseInt(year.split('-')[1]) - i);
                                pastYears.push(pastYear);
                            }
                            outputHtml += `<h3>Theory Subjects for ${year}</h3>
<table border="1">
    <thead>
        <tr>
            <th rowspan="2">B. Tech. Year</th>
            <th rowspan="2">Sem</th>
            <th rowspan="2">Section</th>
            <th rowspan="2">Name of the Subject</th>
            <th>Faculty result %</th>
            <th colspan="5">Average Results % in Subject in all Sections</th>
            <th rowspan="2">Section Average</th> <!-- New Column Header -->
        </tr>
        <tr>
        <th>${pastYears[0]}</th>
            <th>${pastYears[0]}</th>
            <th>${pastYears[1]}</th>
            <th>${pastYears[2]}</th>
            <th>${pastYears[3]}</th>
            <th>${pastYears[4]}</th>
        </tr>
    </thead>
    <tbody>`;

yearSubjects.forEach(sub => {
    const avgCurrentYearPass = calculateAveragePass(teacherData, sub, year, 0); // Current Year
    const pastYear1AvgPass = calculateAveragePass(teacherData, sub, year, 1); // Past Year 1
    const pastYear2AvgPass = calculateAveragePass(teacherData, sub, year, 2); // Past Year 2
    const pastYear3AvgPass = calculateAveragePass(teacherData, sub, year, 3); // Past Year 3
    const pastYear4AvgPass = calculateAveragePass(teacherData, sub, year, 4); // Past Year 4

    // Calculate section average
    const sectionAverage = calculateSectionAverage(teacherData, year, sub['B. Tech. Year'], sub['Sem'], sub['Section']);

    outputHtml += `<tr>
                        <td>${sub['B. Tech. Year']}</td>
                        <td>${sub['Sem']}</td>
                        <td>${sub['Section']}</td>
                        <td>${sub['Name of the subject']}</td>
                        <td>${(parseFloat(sub['% of Pass']) || 0).toFixed(2)}</td>
                        <td>${avgCurrentYearPass}</td>
                        <td>${pastYear1AvgPass}</td>
                        <td>${pastYear2AvgPass}</td>
                        <td>${pastYear3AvgPass}</td>
                        <td>${pastYear4AvgPass}</td>
                        <td>${sectionAverage}</td> <!-- New Section Average Column -->
                    </tr>`;
});

outputHtml += `</tbody></table>`;

                        }
                    });
                } else {
                    // For Lab, display subjects without average pass percentages
                    if (selectedSubjects.length > 0) {
                        outputHtml += `<h3>${subjectTitle}</h3>
                                      <table border="1">
                                          <thead>
                                              <tr>
                                                  <th>Academic Year</th>
                                                  <th>B. Tech. Year</th>
                                                  <th>Sem</th>
                                                  <th>Section</th>
                                                  <th>Name of the subject</th>
                                                  <th>% of Pass</th>
                                              </tr>
                                          </thead>
                                          <tbody>`;

                        selectedSubjects.forEach(teacher => {
                            outputHtml += `<tr>
                                            <td>${teacher['Academic Year']}</td>
                                            <td>${teacher['B. Tech. Year']}</td>
                                            <td>${teacher['Sem']}</td>
                                            <td>${teacher['Section']}</td>
                                            <td>${teacher['Name of the subject']}</td>
                                            <td>${(parseFloat(teacher['% of Pass']) || 0).toFixed(2)}</td> 
                                          </tr>`;
                        });

                        outputHtml += `</tbody></table>`;
                    } else {
                        outputHtml += `<h3>No Lab Subjects Found.</h3>`;
                    }
                }

                // Add signature placeholders
                outputHtml += `<div class="signature" style="margin-top: 20px;">
                                  <p>Signature of COE: ________________________</p>
                                  <p>Signature of Director: ________________________</p>
                              </div>`;

                // Set the result HTML
                resultDiv.innerHTML = outputHtml;

                // Show the print button
                printButton.style.display = 'block';
            } else {
                resultDiv.innerHTML = `<h2>No details found for the entered EMP Code.</h2>`;
                printButton.style.display = 'none';
            }
        });

        // Add PDF generation functionality


    })
    .catch(error => console.error('Error loading teacher data:', error));
