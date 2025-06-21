const axios = require('axios');
const fs = require('fs');

const url = 'https://leetcode.com/graphql';
const limit = 50;

const query = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug,
      limit: $limit,
      skip: $skip,
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        questionId
        title
        titleSlug
        difficulty
        acRate
        isPaidOnly
      }
    }
  }
`;

async function fetchAllProblems() {
  let allProblems = [];
  let skip = 0;
  let total = 1; 

  while (skip < total) {
    const variables = {
      categorySlug: "",
      skip: skip,
      limit: limit,
      filters: {}
    };

    try {
      const response = await axios.post(
        url,
        {
          query,
          variables
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com/problemset/all/',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const data = response.data.data.problemsetQuestionList;

      if (!data) {
        console.error('Error: No data in response', response.data);
        break;
      }

      const problems = data.questions;
      total = data.total;

      console.log(`Fetched ${skip + problems.length} / ${total} problems`);
      allProblems.push(...problems);
      skip += limit;
    } catch (err) {
      console.error(`Failed at skip=${skip}:`, err.response?.data || err.message);
      break;
    }
  }

  fs.writeFileSync('leetcode_problems.json', JSON.stringify(allProblems, null, 2));
}

fetchAllProblems();
