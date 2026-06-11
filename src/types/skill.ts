/** 技能参数 */
export interface SkillParam {
  name: string;
  value: number;
  unit?: string;
}

/** 规则引擎生成的技能结果 */
export interface Skill {
  name: string;
  tags: string[];
  params: SkillParam[];
  /** 简短风味描述 */
  description: string;
}

/** 规则引擎 trace 记录，用于 How 页解释 */
export interface TraceEntry {
  step: string;
  detail: string;
}

export interface SkillResult {
  skill: Skill;
  trace: TraceEntry[];
}
