/** Cost of one subtopic = durationHours × sum of all team-professional hourlyCosts */
export function calcSubtopicCost(sub: any): number {
  return (sub.teams ?? []).reduce((total: number, st: any) => {
    const costPerHour = (st.team?.professionals ?? []).reduce((sum: number, tp: any) => {
      return sum + Number(tp.professional?.hourlyCost ?? 0);
    }, 0);
    return total + (sub.durationHours ?? 0) * costPerHour;
  }, 0);
}

export function calcTopicCost(topic: any): number {
  return (topic.subtopics ?? []).reduce((sum: number, sub: any) => sum + calcSubtopicCost(sub), 0);
}

export function calcStageCost(stage: any): number {
  return (stage.topics ?? []).reduce((sum: number, t: any) => sum + calcTopicCost(t), 0);
}
