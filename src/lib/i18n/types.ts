export interface CriterionOptionTranslation {
  score: number;
  label: string;
}

export interface CriterionTranslation {
  id: number;
  name: string;
  description: string;
  hint: string;
  options: CriterionOptionTranslation[];
}

export interface CategoryTranslation {
  id: number;
  name: string;
  icon: string;
}

export interface AnalysisDataTranslation {
  strengthNote: string;
  weaknessNote: string;
  suggestion: string;
}

export interface Translations {
  // Language info
  langName: string;
  langCode: string;

  // Common
  common: {
    continue: string;
    back: string;
    submit: string;
    share: string;
    copied: string;
    newSurvey: string;
    totalScore: string;
    criteria: string;
    minutes: string;
    skip: string;
    startSurvey: string;
    loading: string;
    perMonth: string;
    perYear: string;
  };

  // Home page
  home: {
    systemTitle: string;
    heroTitle: string;
    heroDescription: string;
    badge20: string;
    badgeInstant: string;
    badgeShare: string;
    step1: string;
    step2: string;
    step3: string;
    startButton: string;
    historyButton: string;
  };

  // Header
  header: {
    subtitle: string;
  };

  // Modal
  modal: {
    title: string;
    step1Hint: string;
    step2Hint: string;
    addressSection: string;
    required: string;
    gpsButton: string;
    gpsLoading: string;
    streetPlaceholder: string;
    wardPlaceholder: string;
    districtPlaceholder: string;
    cityPlaceholder: string;
    surveyorSection: string;
    surveyorPlaceholder: string;
    landlordPlaceholder: string;
    phonePlaceholder: string;
    rentPlaceholder: string;
    areaPlaceholder: string;
    competitorLabel: string;
    competitorPlaceholder: string;
    additionalInfo: string;
    optional: string;
    addressEntered: string;
    surveyorLabel: string;
    notFound: string;
    errorStreet: string;
    errorDistrict: string;
    errorCity: string;
    errorSurveyor: string;
    errorGPS: string;
    errorGPSNotSupported: string;
    fileTooLarge: string;
  };

  // Evaluate page
  evaluate: {
    surveying: string;
    reviewAndSubmit: string;
    reviewTitle: string;
    reviewHint: string;
    uploadTitle: string;
    uploadHint: string;
    uploadButton: string;
    uploadLimit: string;
    uploadMaxSize: string;
    filesSelected: string;
    remainingCriteria: string;
    viewResults: string;
    uploading: string;
    processing: string;
  };

  // Result page
  result: {
    notFound: string;
    locationInfo: string;
    address: string;
    landlord: string;
    phone: string;
    rentPrice: string;
    area: string;
    surveyor: string;
    surveyDate: string;
    competitor: string;
    scoreByGroup: string;
    quickReview: string;
    strengths: string;
    warnings: string;
    suggestions: string;
    allAverage: string;
    images: string;
    exportError: string;
    smartSummaryFeasible: string;
    smartSummaryPotential: string;
    smartSummaryRisky: string;
  };

  // History page
  history: {
    title: string;
    surveysCompleted: string;
    noSurveys: string;
    noSurveysHint: string;
    startFirst: string;
    clearHistory: string;
    clearConfirm: string;
    newButton: string;
  };

  // Map
  map: {
    searching: string;
    hint: string;
  };

  // Categories
  categories: CategoryTranslation[];

  // Criteria (20 items)
  criteriaList: CriterionTranslation[];

  // Verdicts
  verdicts: {
    feasible: { label: string; description: string };
    potential: { label: string; description: string };
    risky: { label: string; description: string };
  };

  // Analysis data
  analysisData: Record<number, AnalysisDataTranslation>;

  // Analysis fallback suggestions
  analysisFallback: {
    allGood: string[];
    fillers: string[];
  };
}
