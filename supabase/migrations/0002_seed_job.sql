-- Seed the role this tool is hiring for. A Job Description is system CONFIG (the
-- criteria HR screens against), not candidate data — so seeding it is legitimate.
-- Idempotent: only inserts if a job with this title doesn't already exist.

insert into job_descriptions (title, department, seniority, raw_text, required_skills, nice_to_have)
select
  'Senior AI Workflow & Automation Engineer',
  'Engineering',
  'Senior',
  $jd$เรากำลังมองหา Senior AI Workflow & Automation Engineer ที่ออกแบบและสร้างระบบอัตโนมัติด้วย AI/LLM ในระดับ production

หน้าที่หลัก:
- ออกแบบ orchestrate workflow อัตโนมัติด้วย LLM (agent, RAG, tool-use)
- สร้าง integration ระหว่างระบบต่าง ๆ (event-driven, API, webhook)
- เขียน automation ด้วย Python และเครื่องมือเช่น n8n / LangChain
- ดูแล reliability, observability และ cost ของ pipeline ที่ใช้ AI

คุณสมบัติที่ต้องมี:
- ประสบการณ์ 5+ ปี ด้าน backend / platform / automation engineering
- เชี่ยวชาญ Python และการเรียกใช้ LLM API
- เข้าใจการออกแบบ workflow อัตโนมัติและ event-driven architecture
- สื่อสารกับทีมข้ามสายงานได้ดี

จะดีมากถ้ามี:
- ประสบการณ์ MLOps / deploy โมเดล
- เคยใช้ n8n, LangChain, vector database
- พื้นฐาน cloud (GCP / AWS)$jd$,
  array['Python','LLM API','Workflow automation','Event-driven architecture','API integration'],
  array['MLOps','n8n','LangChain','Vector database','GCP/AWS']
where not exists (
  select 1 from job_descriptions where title = 'Senior AI Workflow & Automation Engineer'
);
