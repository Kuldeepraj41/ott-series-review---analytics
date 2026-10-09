import re

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


_analyzer = SentimentIntensityAnalyzer()
_RADAR_DIMENSIONS = {
    'storytelling': re.compile(
        r'\b(storytelling|story|plot|writing|screenplay|narrative|script|dialogue)\b',
        re.IGNORECASE,
    ),
    'production': re.compile(
        r'\b(production|cinematography|visuals?|effects|cgi|animation|direction|directing|'
        r'editing|costumes?|set design)\b',
        re.IGNORECASE,
    ),
    'pacing': re.compile(
        r'\b(pacing|pace|slow|slowly|rushed|drags|dragging|runtime|episode length)\b',
        re.IGNORECASE,
    ),
    'characterDepth': re.compile(
        r'\b(characters?|characterization|character development|acting|performances?|'
        r'protagonist|villain|cast)\b',
        re.IGNORECASE,
    ),
    'soundtrack': re.compile(
        r'\b(soundtrack|score|music|songs?|theme music)\b',
        re.IGNORECASE,
    ),
    'rewatchability': re.compile(
        r'\b(rewatch(?:able)?|replay|binge(?:able)?|repeat viewing)\b',
        re.IGNORECASE,
    ),
}
_SENTENCE_BOUNDARY = re.compile(r'(?<=[.!?])\s+')


def classify_sentiment(text):
    compound = _analyzer.polarity_scores(text)['compound']
    if compound >= 0.05:
        return 'positive'
    if compound <= -0.05:
        return 'negative'
    return 'neutral'


def estimate_radar_metrics(reviews):
    review_scores = {dimension: [] for dimension in _RADAR_DIMENSIONS}
    for review in reviews:
        text = f'{review.title}. {review.content}'.strip()
        sentences = _SENTENCE_BOUNDARY.split(text)
        matched_scores = {dimension: [] for dimension in _RADAR_DIMENSIONS}
        for sentence in sentences:
            matched_dimensions = [
                dimension
                for dimension, pattern in _RADAR_DIMENSIONS.items()
                if pattern.search(sentence)
            ]
            if not matched_dimensions:
                continue
            score = _analyzer.polarity_scores(sentence)['compound']
            for dimension in matched_dimensions:
                matched_scores[dimension].append(score)

        for dimension in _RADAR_DIMENSIONS:
            scores = matched_scores[dimension]
            if scores:
                review_scores[dimension].append(sum(scores) / len(scores))

    scores = {}
    evidence = {}
    for dimension, values in review_scores.items():
        evidence[dimension] = len(values)
        scores[dimension] = (
            round(50 + 50 * sum(values) / len(values))
            if values
            else 50
        )
    return scores, evidence