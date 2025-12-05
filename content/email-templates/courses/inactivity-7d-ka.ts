import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getInactivity7dKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `მოგვენატრეთ! გააგრძელეთ ${vars.courseTitle}`,
    previewText: `თქვენი კურსი გელოდებათ. აიღეთ იქიდან, სადაც გაჩერდით.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">მოგვენატრეთ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            დაახლოებით კვირაა გავიდა მას შემდეგ, რაც <strong>${vars.courseTitle}</strong>-ს ეწვიეთ. გვინდოდა შეგახსენოთ, რომ თქვენი პროგრესი კვლავ შენახულია!
          </p>
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">თქვენი პროგრესი</p>
            <div style="background-color: #E5E7EB; border-radius: 100px; height: 12px; margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); border-radius: 100px; height: 12px; width: ${vars.progressPercent}%;"></div>
            </div>
            <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0;">${vars.progressPercent}% დასრულებული</p>
            <p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან</p>
            ${vars.currentLesson ? `<p style="color: #4F46E5; font-size: 14px; margin: 15px 0 0 0;">შემდეგი: ${vars.currentLesson}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ცხოვრება დატვირთულია—ვიცით. მაგრამ თუნდაც 10-15 წუთი დაგეხმარებათ წინსვლაში და მასალის ახალი შენარჩუნებაში.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელეთ იქიდან, სადაც გაჩერდით
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ჩვენ გისურვებთ წარმატებას!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს შეტყობინება, რადგან დარეგისტრირდით კურსზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

დაახლოებით კვირაა გავიდა მას შემდეგ, რაც ${vars.courseTitle}-ს ეწვიეთ. გვინდოდა შეგახსენოთ, რომ თქვენი პროგრესი კვლავ შენახულია!

თქვენი პროგრესი: ${vars.progressPercent}% დასრულებული
${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან
${vars.currentLesson ? `შემდეგი: ${vars.currentLesson}` : ''}

ცხოვრება დატვირთულია—ვიცით. მაგრამ თუნდაც 10-15 წუთი დაგეხმარებათ წინსვლაში და მასალის ახალი შენარჩუნებაში.

გააგრძელეთ იქიდან, სადაც გაჩერდით: ${vars.continueUrl}

ჩვენ გისურვებთ წარმატებას!`,
  }
}
