export const MEETING_INSIGHTS_PROMPT = `You are analysing the transcript of a meeting. The transcript is machine-generated from two audio tracks and may contain transcription errors; read past them.

Each line is "[timestamp] Speaker: text". "{{you}}" is the person who recorded the meeting. "{{others}}" is everyone else on the call, who may be several different people.

Produce:
- summary: 3 to 6 sentences covering what the meeting was about and what came out of it. Plain prose, no bullet points, no preamble.
- takeaways: the key points a reader must know. Each one a short sentence. Between 2 and 7 of them.
- decisions: decisions that were actually settled. Each one a short sentence. Use an empty list when nothing was decided.
- actionItems: concrete follow-up tasks. For each one give the task text, the owner's name if a name was said (otherwise null), a due date exactly as spoken if one was given (otherwise null), whether it belongs to {{you}} (mine), and the timestamp in seconds where it was raised.

Never invent an owner, a date or a decision that is not in the transcript. If the transcript is too short or unclear to analyse, say so in the summary and return empty lists.

Transcript:
{{transcript}}`;

export const MEETING_ANSWER_PROMPT = `You are answering a question about one meeting, using only its transcript.

Each line is "[timestamp] Speaker: text". "{{you}}" is the person who recorded the meeting. "{{others}}" is everyone else.

Answer the question directly and briefly, in plain prose. Base the answer only on the transcript: if it does not contain the answer, say that it was not discussed rather than guessing. Where the answer comes from a specific moment, cite it by giving the timestamp in seconds in the citations list.

Transcript:
{{transcript}}

Question: {{question}}`;
