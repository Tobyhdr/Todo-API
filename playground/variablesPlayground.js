var grades =[28, 48];

function updateGrades (grade) {
	grades.push(grade); //Updates array

	grades = [12, 33, 99]; //Creates new array within variable, does not update exiting array of same name
}

updateGrades(52);

console.log(grades);