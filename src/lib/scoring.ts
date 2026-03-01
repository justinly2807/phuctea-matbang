import { EvaluationScores, CategoryScore } from '@/types';
import { CATEGORIES, getCriteriaByCategory } from './criteria';

export function calculateCategoryScores(scores: EvaluationScores): CategoryScore[] {
  return CATEGORIES.map((cat) => {
    const criteria = getCriteriaByCategory(cat.id);
    const catScore = criteria.reduce((sum, c) => sum + (scores[String(c.id)] || 0), 0);
    const maxScore = criteria.length * 5;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      score: catScore,
      maxScore,
      percentage: Math.round((catScore / maxScore) * 100),
    };
  });
}
