import axios from 'axios';
import fs from 'fs';
import { problemList } from './leetcode_problems.ts';

const url = 'https://leetcode.com/graphql';
const allProblems = problemList;

const questionDetailQuery = `
  query getQuestionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      topicTags {
        name
        slug
      }
      difficulty
      questionId
      acRate
      isPaidOnly
    }
  }
`;

const BATCH_SIZE = 20;         // number of requests in parallel
const BATCH_DELAY_MS = 100;   // delay between batches

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchQuestionDetail(titleSlug) {
  try {
    const res = await axios.post(
      url,
      {
        query: questionDetailQuery,
        variables: { titleSlug }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': `https://leetcode.com/problems/${titleSlug}`,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching ${titleSlug}:`, err.response?.data || err.message);
    return null;
  }
}

async function fetchCategoriesForProblems(problems) {
  const categoryMap = {};

  for (let i = 0; i < problems.length; i += BATCH_SIZE) {
    const batch = problems.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(p => fetchQuestionDetail(p.titleSlug))
    );

    results.forEach(q => {
      if (!q) {return;}
      for (const tag of q.topicTags) {
        const category = tag.name;
        if (!categoryMap[category]) {
          categoryMap[category] = [];
        }
        categoryMap[category].push({
          questionId: q.questionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          acRate: q.acRate,
          paidOnly: q.isPaidOnly
        });
      }
      console.log(`Fetched: ${q.title}`);
    });

    console.log(`Completed ${Math.min(i + BATCH_SIZE, problems.length)} / ${problems.length}`);
    await sleep(BATCH_DELAY_MS);
  }

  fs.writeFileSync('category_wise_questions.json', JSON.stringify(categoryMap, null, 2));
  console.log('Saved to category_wise_questions.json');
}

fetchCategoriesForProblems(allProblems);
