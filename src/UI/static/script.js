// const {data} =  require('../../data/category_wise_questions');
const container = document.getElementById('container');
Object.entries(data).forEach(([category, problems]) => {
    // Category Header
    const catDiv = document.createElement('div');
    catDiv.className = 'category';

    const catTitle = document.createElement('h3');
    catTitle.textContent = category;

    const problemsDiv = document.createElement('div');
    problemsDiv.className = 'problems';

    catTitle.onclick = () => {
    problemsDiv.style.display = problemsDiv.style.display === 'block' ? 'none' : 'block';
    };

    // Problems
    problems.forEach(problem => {
    const probDiv = document.createElement('div');
    probDiv.className = 'problem';

    const probTitle = document.createElement('div');
    probTitle.className = 'problem-title';
    probTitle.textContent = problem.title;

    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'parse-btn-wrapper';

    const btn = document.createElement('button');
    btn.className = 'parse-btn';
    btn.textContent = 'Parse Question';

    btnWrapper.appendChild(btn);

    probTitle.onclick = () => {
        btnWrapper.style.display = btnWrapper.style.display === 'block' ? 'none' : 'block';
    };

    probDiv.appendChild(probTitle);
    probDiv.appendChild(btnWrapper);
    problemsDiv.appendChild(probDiv);
    });

    catDiv.appendChild(catTitle);
    catDiv.appendChild(problemsDiv);
    container.appendChild(catDiv);
});