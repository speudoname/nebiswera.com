import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getInactivity14dKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `თქვენი კურსი გელოდებათ, ${vars.firstName}!`,
    previewText: `2 კვირა გავიდა. ნუ დაუშვებთ თქვენი პროგრესის დაკარგვას.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">თქვენი კურსი მოგენატრათ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ორი კვირა გავიდა თქვენი ბოლო ვიზიტიდან კურსზე <strong>${vars.courseTitle}</strong>. არ გვინდა დაკარგოთ შექმნილი იმპულსი!
          </p>
          <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
              თქვენ უკვე ${vars.progressPercent}%-ზე ხართ!
            </p>
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              ${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია
            </p>
            ${vars.currentLesson ? `<p style="color: #D97706; font-size: 14px; margin: 10px 0 0 0;">განაგრძეთ: ${vars.currentLesson}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>გახსოვდეთ, რატომ დაიწყეთ.</strong> თქვენ ამ კურსზე დარეგისტრირდით, რადგან გინდოდათ სწავლა და განვითარება. ეს მიზანი კვლავ ხელმისაწვდომია.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            აი, მარტივი გეგმა დასაბრუნებლად:
          </p>
          <ol style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>გამოყავით დღეს მხოლოდ 15 წუთი</li>
            <li>ნახეთ ერთი გაკვეთილი ან გადახედეთ ჩანაწერებს</li>
            <li>დაგეგმეთ შემდეგი სასწავლო სესია</li>
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              დაბრუნდით გზაზე
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენ უკვე მიაღწიეთ პროგრესს—ნუ დაუშვებთ მის დაკარგვას!
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

ორი კვირა გავიდა თქვენი ბოლო ვიზიტიდან კურსზე ${vars.courseTitle}. არ გვინდა დაკარგოთ შექმნილი იმპულსი!

თქვენ უკვე ${vars.progressPercent}%-ზე ხართ!
${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია
${vars.currentLesson ? `განაგრძეთ: ${vars.currentLesson}` : ''}

გახსოვდეთ, რატომ დაიწყეთ. თქვენ ამ კურსზე დარეგისტრირდით, რადგან გინდოდათ სწავლა და განვითარება. ეს მიზანი კვლავ ხელმისაწვდომია.

აი, მარტივი გეგმა დასაბრუნებლად:
1. გამოყავით დღეს მხოლოდ 15 წუთი
2. ნახეთ ერთი გაკვეთილი ან გადახედეთ ჩანაწერებს
3. დაგეგმეთ შემდეგი სასწავლო სესია

დაბრუნდით გზაზე: ${vars.continueUrl}

თქვენ უკვე მიაღწიეთ პროგრესს—ნუ დაუშვებთ მის დაკარგვას!`,
  }
}
