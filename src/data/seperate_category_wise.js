import axios from 'axios';
import fs from 'fs';
import mongoose from 'mongoose';

// MongoDB connection URI (change it according to your setup)
const MONGO_URI = 'mongodb://localhost:27017/leetcode_db';

const allProblems = JSON.parse(fs.readFileSync('leetcode_problems.json', 'utf8'));
const url = 'https://leetcode.com/graphql';

// GraphQL query to get topic tags for a question
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
      paidOnly
    }
  }
`;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define MongoDB schema
const questionSchema = new mongoose.Schema({
  questionId: String,
  title: String,
  titleSlug: String,
  difficulty: String,
  acRate: Number,
  paidOnly: Boolean
}, { _id: false });

const categorySchema = new mongoose.Schema({
  category: String,
  questions: [questionSchema]
});

const Category = mongoose.model('Category', categorySchema);

async function fetchCategoriesForProblems(problems) {
  const categoryMap = {};

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    try {
      const res = await axios.post(
        url,
        {
          query: questionDetailQuery,
          variables: { titleSlug: problem.titleSlug }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': `https://leetcode.com/problems/${problem.titleSlug}`,
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const q = res.data.data.question;
      if (!q) {continue;}

      for (const tag of q.topicTags) {
        const category = tag.name;
        if (!categoryMap[category]) {
          categoryMap[category] = [];
        }
        // Avoid duplicates if same question appears in multiple categories
        categoryMap[category].push({
          questionId: q.questionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          acRate: q.acRate,
          paidOnly: q.paidOnly
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`Error fetching ${problem.titleSlug}`, err.response?.data || err.message);
    }
  }

  // Save to MongoDB
  for (const [category, questions] of Object.entries(categoryMap)) {
    await Category.findOneAndUpdate(
      { category },
      { category, questions },
      { upsert: true, new: true }
    );
  }

  console.log('All categories and questions saved to MongoDB');
  mongoose.disconnect();
}

fetchCategoriesForProblems(allProblems);
