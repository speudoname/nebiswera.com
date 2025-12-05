import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getHalfwayMilestoneKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `თქვენ შუა გზაზე ხართ ${vars.courseTitle}-ში!`,
    previewText: `საოცარი პროგრესი! თქვენ კურსის 50% დაასრულეთ.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 შუა გზაზე ხართ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            რა მიღწევაა! თქვენ მიაღწიეთ <strong>50%-იან ეტაპს</strong> კურსში <strong>${vars.courseTitle}</strong>.
          </p>
          <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #92400E; font-size: 14px; margin: 0 0 10px 0;">თქვენი პროგრესი</p>
            <div style="background-color: #FDE68A; border-radius: 100px; height: 20px; margin: 15px 0;">
              <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 100px; height: 20px; width: ${vars.progressPercent}%;"></div>
            </div>
            <p style="color: #D97706; font-size: 36px; font-weight: bold; margin: 10px 0 0 0;">${vars.progressPercent}%</p>
            <p style="color: #92400E; font-size: 14px; margin: 10px 0 0 0;">${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენ ნამდვილი თავდადება გამოიჩინეთ ამ წერტილამდე მისაღწევად. ფინიშის ხაზი უკვე თვალსაწიერშია—გააგრძელეთ ასე!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელეთ ძლიერად დასასრულებლად
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენ საოცრად აკეთებთ!
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

რა მიღწევაა! თქვენ მიაღწიეთ 50%-იან ეტაპს კურსში ${vars.courseTitle}.

თქვენი პროგრესი: ${vars.progressPercent}%
${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია

თქვენ ნამდვილი თავდადება გამოიჩინეთ ამ წერტილამდე მისაღწევად. ფინიშის ხაზი უკვე თვალსაწიერშია—გააგრძელეთ ასე!

გააგრძელეთ სწავლა: ${vars.continueUrl}

თქვენ საოცრად აკეთებთ!`,
  }
}
