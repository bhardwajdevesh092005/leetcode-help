const vscode = acquireVsCodeApi();
const container = document.getElementById('container');
const searchBar = document.getElementById('searchBar');

let fuse; // Will hold the Fuse.js instance

// Build a flat array of all problems for Fuse.js
const flatProblems = [];
Object.entries(data).forEach(([category, problems]) => {
  problems.forEach(problem => {
    flatProblems.push({
      ...problem,
      category,
    });
  });
});

// Initialize Fuse.js
fuse = new Fuse(flatProblems, {
  keys: ['title'],
  threshold: 0.9, // Lower is stricter, higher is fuzzier
});

// Debounce utility function
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Render function
function renderProblems(filteredData) {
  container.innerHTML = '';

  Object.entries(filteredData).forEach(([category, problems]) => {
    if (problems.length === 0) return;

    const catDiv = document.createElement('div');
    catDiv.className = 'category';

    const catTitle = document.createElement('h3');
    catTitle.textContent = category;

    const problemsDiv = document.createElement('div');
    problemsDiv.className = 'problems';

    catTitle.onclick = () => {
      problemsDiv.style.display = problemsDiv.style.display === 'block' ? 'none' : 'block';
    };

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
      btn.addEventListener('click', () => {
        vscode.postMessage({
          action: 'PARSE_QUESTION',
          data: {
            title: problem.title,
            slug: problem.titleSlug,
          },
        });
      });

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
}

// Group filtered results by category
function groupByCategory(results) {
  const grouped = {};
  results.forEach(({ item }) => {
    const category = item.category;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(item);
  });
  return grouped;
}

// Search Handler with debounce and fuzzy match
const handleSearch = debounce(() => {
  const query = searchBar.value.trim();

  if (query === '') {
    renderProblems(data);
    return;
  }

  const results = fuse.search(query);
  const grouped = groupByCategory(results);
  renderProblems(grouped);
}, 200); // 200ms debounce delay

searchBar.addEventListener('input', handleSearch);

// Initial render
renderProblems(data);
