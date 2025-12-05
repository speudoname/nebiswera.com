import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getCourseStartedKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `შესანიშნავი დასაწყისი! თქვენ დაიწყეთ ${vars.courseTitle}`,
    previewText: `თქვენ სწორ გზაზე ხართ! შეინარჩუნეთ იმპულსი.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">შესანიშნავი დასაწყისი!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            გილოცავთ კურსის <strong>${vars.courseTitle}</strong> დაწყებას! პირველი ნაბიჯის გადადგმა ხშირად ყველაზე რთულია, და თქვენ ეს გააკეთეთ.
          </p>
          <div style="background-color: #ECFDF5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #065F46; font-size: 14px; margin: 0 0 10px 0;">თქვენი პროგრესი</p>
            <p style="color: #059669; font-size: 36px; font-weight: bold; margin: 0;">${vars.progressPercent}%</p>
            <p style="color: #065F46; font-size: 14px; margin: 10px 0 0 0;">${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            გააგრძელეთ! თანმიმდევრულობა ნებისმიერი ახალი უნარის დაუფლების გასაღებია. თუნდაც რამდენიმე წუთი ყოველდღე დიდ შედეგს მოგცემთ.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელეთ სწავლა
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ჩვენ გაგიხარდებათ თქვენი წარმატება!
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

გილოცავთ კურსის ${vars.courseTitle} დაწყებას! პირველი ნაბიჯის გადადგმა ხშირად ყველაზე რთულია, და თქვენ ეს გააკეთეთ.

თქვენი პროგრესი: ${vars.progressPercent}%
${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან დასრულებულია

გააგრძელეთ! თანმიმდევრულობა ნებისმიერი ახალი უნარის დაუფლების გასაღებია. თუნდაც რამდენიმე წუთი ყოველდღე დიდ შედეგს მოგცემთ.

გააგრძელეთ სწავლა: ${vars.continueUrl}

ჩვენ გაგიხარდებათ თქვენი წარმატება!`,
  }
}
