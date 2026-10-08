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
        for dimension, pattern in _RADAR_DIMENSIONS.items():
            matched_scores = [
                _analyzer.polarity_scores(sentence)['compound']
                for sentence in sentences
                if pattern.search(sentence)
            ]
            if matched_scores:
                review_scores[dimension].append(sum(matched_scores) / len(matched_scores))

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