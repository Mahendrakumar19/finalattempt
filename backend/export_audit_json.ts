import fs from 'fs';
import path from 'path';
import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';

const fullPastedText = `
POLITY POLITY BOOK  
CONSTITUENT ASSEMBLY AND CONSTITUTION MAKING PROCESS 
1. When did the first meeting of the Constituent Assembly take place? 66th B.P.S.C. (Re
Exam) 2020 
(a) December 9, 1946 
(b) August 15, 1947 
(c) November 26, 1949 
(d) 26 January, 1946 
(e) None of the above / More than one of the above 
2. How much time did it take to make the Indian Constitution? 68th B.P.S.C. (Pre) 2023 
(a) 2 years, 11 months and 18 days 
(b) 1 year, 10 months and 12 days 
(c) 2 years, 10 months and 5 days 
(d) More than one of the above 
(e) None of the above 
3. The decision to implement the Constitution on 26 January was taken because 53rd to 
55th B. P.C.S (Pre) 2011 
(a) Congress celebrated this date as Independence Day in 1930. 
(b) Quit India Movement was started on this date in 1942. 
(c) It was an auspicious day. 
(d) None of the above 
4. By whom was the Constitution of India adopted? B.P.S.C. (CDPO) (For) 2018 
(a) Governor General 
(b) British Parliament 
(c) Constituent Assembly 
(d) Parliament of India 
(e) None of the above / More than one of the above 
5. The Indian Constitution was adopted by the Constituent Assembly- . 38th B.P.S.C. (Pre) 
1992-93 
(a) On November 26, 1949 
(b) On August 15, 1949 
(c) On October 2, 1949 
(d) On November 15, 1949 
6. The Indian Constitution was adopted 39th B.P.S.C. (Pre) 1994 
(a) By the Constituent Assembly 
POLITY POLITY BOOK  
(b) By the British Parliament 
(c) By the Governor General 
(d) by the Indian Parliament 
7. Indian Constitution Day is celebrated on- 60th to 62nd B.P.S.C (Pre) 2016 
(a) 26 October 
(b) 26 November 
(c) 26 January 
(d) 15 August 
(e) None of the above / More than one of the above 
MAJOR COMMITTEES OF THE CONSTITUENT ASSEMBLY 
8. On August 29, 1947, the Constitution Writing Committee was formed, whose chairman 
was Dr. B. R. Ambedkar and six other members. Who among the following was not a 
member of this committee? B.P.S.C. (CDPO) 2005 
(a) N. Gopalaswami Iyengar 
(b) Jawaharlal Nehru 
(c) Kanhaiyalal Maniklal Munshi 
(d) Alladi Krishnaswamy Iyer 
9. Who among the following was the first Chairman of the Administration of Trade 
Committee of the Constituent Assembly? B.P.S.C. (CDPO) 2009 
(a) Jawaharlal Nehru 
(b) Sachchidanand Sinha 
(c) Kanhaiyalal Maniklal Munshi 
(d) Harendra Kumar Mukherjee 
SOURCE OF CONSTITUTION 
10. 'Equality before law' written in Article 14 of the Indian Constitution has been taken from 
the Constitution of which country? 68th B.P.S.C. (Pre) 2023 
(a) France 
(b) Britain 
(c) USA 
(d) More than one of the above 
(e) None of the above 
11. Where did the inspiration for 'Liberty, Equality and Fraternity' come from? B.P.S.C. 
(CDPO) (Pre) 2018 
(a) American Revolution 
POLITY POLITY BOOK  
(b) French Revolution 
(c) Russian Revolution 
(d) Chinese revolution 
(e) None of the above / More than one of the above 
12. The concept of Directive Principles of State Policy in the Indian Constitution was taken 
from the Constitution of which country? 69th B.P.S.C. (Pre) 2023 
(a) Ireland 
(b) England 
(c) Switzerland 
(d) None of the above 
13. From which country has the reference to the idea of fundamental rights in the Indian 
Constitution been taken? 69th B.P.S.C. (Pre) 2023 
(a) Canada 
(b) Ireland 
(c) United States 
(d) United Kingdom 
14. Match List-I with List-II and select the answer using the codes given below: B.P.S.C. 
(CDPO) (Pre) 2005 
List-I (items of the Constitution) 
List-II (Countries taken 
from) 
A. State Policy Director Principle 
1. Australia 
B. Fundamental Rights 
2. Canada 
C. Concurrent list of relations between the 
Union and the States 
3. Ireland 
D. Union of Indian states in which more power 
has been given to the Centre 
4. United States of 
America 
Code: A B C D 
(a) 4 3 1 2 
(b) 3 4 2 1 
(c) 4 3 2 1 
(d) 3 4 1 2 
POLITY POLITY BOOK  
15. The principles governing state policy are described in Part IV of the Indian Constitution. 
This point of the Indian Constitution is inspired and influenced by the constitution of 
which country in the world? B.P.S.C. (CDPO) 2005 
(a) Canada 
(b) Australia 
(c) America 
(d) Ireland 
16. From where did India take the idea of 'Federal System' with a strong centre? B.P.S.C. 
(CDPO) (Pre) 2005 
(a) USA 
(b) Canada 
(c) Australia 
(d) New Zealand 
17. The concept of Public Interest Litigation originated from which country? B.P.S.C. 
(CDPO) (Pre) 2018 
(a) United Kingdom 
(b) Soviet Republic (USSR) 
(c) Australia 
(d) American Republic (USA) 
(e) None of the above / More than one of the above 
MAJOR PARTS AND ARTICLES OF THE CONSTITUTION 
18. The Indian Constitution includes 53rd to 55th B.P.S.C. (Pre) 2011 
(a) 395 articles, 22 parts and 12 lists 
(b) 371 articles, 21 parts and 11 lists 
(c) 372 articles, 20 parts and 7 lists 
(d) 381 articles, 23 parts and 8 lists 
19. India is in alert. 42nd B.P.S.C. 1997-98 
(a) 300 articles 
(b) 350 articles 
(c) More than 400 articles 
(d) 500 articles 
20. The Constitution of India currently includes B.P.S.C. (CDPO) (For) 2005 
(a) 295 sections 
(b) 444 sections 
POLITY POLITY BOOK  
(c) 259 sections 
(d) 301 sections 
21. By which provision of the Constitution has untouchability been abolished? 69th B.P.S.C. 
(Pre) 2023 
(a) Article 14 
(b) Article 21 
(c) Article 17 
(d) Article 19 
22. Which Article of the Indian Constitution provides priority to constitutional provisions 
over rules/laws made by the Union Parliament and State Legislatures? 45th B.P.S.C. 
(Pre) 2001-02 
(a) 13 
(b) 32 
(c) 245 
(d) 326 
23. What is Article 300 of the Indian Constitution related to? 67th B.P.S.C. (Pre) 2022 
(a) Lawsuits and proceedings 
(b) Government contracts 
(c) Attorney General 
(d) Restrictions on trade and commerce 
(e) None of the above / more than one of the above 
24. Under which article/articles can the Speaker allow a member of the House to speak in 
his/her mother tongue? 69th B.P.S.C. (Pre) 2023 
(a) Article 110 (1) 
(b) Article 122 (2) 
(c) Article 120 (1) 
(d) Both (a) and (b) 
SCHEDULES 
25. Match B.P.S.C. (Pre) 2016  
I. 
Federal List 
A. 97 entries 
II. 
State list 
A. 47 entries 
III. 
concurrent list 
B. 66 entries 
POLITY POLITY BOOK  
Code : I II III 
(a) A C B 
(b) A B C 
(c) B A C 
(d) C B A 
(e) None of the above / More than one of the above 
26. Land reform is under subject A. 43rd B.P.S.C. (Pre) 1999 
(a) Union List 
(b) Concurrent List 
(c) State list 
(d) none of these 
27. In which list of the Indian Constitution are the formats of 'oath or affidavit' given? 
B.P.S.C. (CDPO) 2005 
(a) Second list 
(b) Third list 
(c) Fourth list 
(d) Fifth List 
28. Which of the following subjects is in the concurrent list? 47th B.P.S.C. (Pre) 2005 
(a) Agriculture 
(b) education 
(c) police 
(d) defense 
29. Which of the following is not included in the Eleventh Schedule of the Constitution? 
67th B.P.S.C. (Pre) 2022 
(a) Library 
(b) Fuel and fodder 
(c) Rural sports 
(d) technical training 
(e) None of the above / More than one of the above 
30. Prevention of cruelty to animals has been placed in which list of the Indian Constitution? 
66th B.P.S.C. (Re-Exam) 2020 
(a) Center list 
(b) State list 
(c) Concurrent List 
(d) announcer 
POLITY POLITY BOOK  
(e) None of the above / More than one of the above 
31. Which of the following Schedules of the Indian Constitution contains provisions for 
allocation of seats in the Council of States? 
(a) first 
(b) third 
(c) fifth 
(d) fourth 
32. The Fifth Schedule deals with the protection of the rights and interests of which specific 
group of people? 69th B.P.S.C. (Pre) 2023 
(a) Language minorities 
(b) Scheduled Caste 
(c) religious minorities 
(d) Scheduled Tribe 
33. The Tenth Schedule of the Indian Constitution is related to. B.P.S.C. C.D.P.O. 2005 
(a) Anti-defection legislation 
(b) From Panchayati Raj 
(c) Through land reform 
(d) Division of power between the Union and the states 
PREAMBLE 
34. Which of the following sequences is correct in relation to the Preamble of the Indian 
Constitution? 40th B.P.S.C. (Pre) 1995 
(a) Republican, democratic, secular, socialist, sovereign. 
(b) Sovereign, socialist, democratic, secular republic 
(c) Sovereign, democratic, secular, socialist republic 
(d) Sovereign, inclusive, secular, democratic republic 
35. How has India been declared in the Preamble of the Indian Constitution? 42nd B.P.S.C. 
1997-98 
(a) A universal, democratic, republic 
(b) A socialist, democratic, republic 
(c) A sovereign, socialist, secular, democratic republic 
(d) none of these 
36. There is temporal sovereignty in India, because the Preamble of the Constitution begins- 
39th B.P.S.C. (Pre) 1994 
POLITY POLITY BOOK  
(a) From the words democratic India 
(b) From the words of people's democracy 
(c) From the words of people's democracy 
(d) We the people of India through words 
37. Consider the following words. 48th to 52th B.P.S.C. (Pre) 2008  
A. Socialist 
B. Democratic  
C. Universal  
D. Secular 
Give order the right words according to the thought 
(a) C, A, D and B 
(b) C, D, A and B 
(c) C, D, B and A 
(d) D, A, C and B 
38. Which of the following is mentioned in the Preamble of the Constitution of India One 
was not included in the main before? B.P.S.C. (CDPO) (Pre) 2005 
(a) Freedom and equality 
(b) Secular and democracy 
(c) Socialism and equality 
(d) Socialism and secularism 
39. Under which amendment was the word 'socialist' added to the Preamble of the Indian 
Constitution? B.P.S.C. (Pre) 2016 
(a) 42nd amendment 
(b) 44th amendment 
(c) 46th amendment 
(d) 74th amendment 
(e) None of the above / More than one of the above 
40. By which amendment have the words 'socialist and secular' been added to the Preamble 
of the Indian Constitution? B.P.S.C. (CDPO) (Pre) 2005 
(a) 39th 
(b) 40th 
(c) 42nd 
(d) 44th 
41. Which of the following describes India as a secular state? B.P.S.C. (CDPO) (Pre) 2018 
POLITY POLITY BOOK  
(a) Fundamental rights 
(b) Ninth list 
(c) Fundamental Duties 
(d) Preamble of the Constitution 
(e) None of the above / More than one of the above 
42. Which of the following is called the 'Soul' of the Indian Constitution? B.P.S.C. (CDPO) 
(Pre) 2005 
(a) Chapter of Fundamental Rights 
(b) Chapter of Directive Principles of State Policy 
(c) Preamble of the Constitution 
(d) Right to constitutional remedies 
SYSTEM OF GOVERNANCE 
43. What is the nature of the Indian Constitution? 63rd B.P.S.C. (Pre) 2017 
(a) federal 
(b) unitary 
(c) Parliamentary 
(d) Federal in nature but unitary in spirit 
(e) None of the above / more than one of the above 
44. Who among the following is supreme in the Indian political system? 45th B.P.S.C. (Pre) 
2001 
(a) The Supreme Court 
(b) Constitution 
(c) Parliament 
(d) religion 
45. Which of the following is true about the parliamentary system of government Which 
statement is correct? 65th B.P.S.C. (Pre) 2019 
(a) The legislature is answerable to the judiciary. 
(b) The legislature is accountable to the executive. 
(c) Both the legislature and the executive are independent. 
(d) The President is answerable to the judiciary. 
(e) None of the above / More than one of the above 
46. Democracy in India is based on the fact that- 39th B.P.S.C. (Pre) 1994 
(a) The Constitution is written. 
(b) Fundamental rights are provided here. 
(c) The public has the right to elect and change governments. 
POLITY POLITY BOOK  
(d) Here are the directive principles of state policy. 
47. What is meant by 'rule of law' or 'dominion of law'? 66th B.P.S.C. (Pre) 2020 
(a) One law for all and one judiciary for all 
(b) One law for all and one state for all 
(c) One state for all and one judiciary for all 
(d) All laws for one and one judiciary for all 
(e) None of the above/More than one of the above 
48. What is 'Division System' related to in Indian Administration? 67th B.P.S.C. (Pre) 2022 
(a) Audit accounts 
(b) Centre/State 
(c) Policy Implementation 
(d) All India Services Central Services 
(e) None of the above / More than one of the above 
49. Which of the following characteristics is not correct for a unitary form of government? 
65th B.P.S.C. (Pre) 2019 
(a) Immediate Decision 
(b) Flexibility 
(c) Ideal for big countries 
(d) Uniformity of law 
(e) None of the above / More than one of the above 
50. Which of the following statements is true? 38th B.P.S.C. (Pre) 1992 
(a) The United States has a federal system of government. 
(b) Federal and unitary form of government in India are both types of systems. 
(c) France has a federal system of government. 
(d) In Pakistan, the Prime Minister is appointed by the people there. 
STATES AND UNION TERRITORIES 
51. Delhi is- 42nd B.P.S.C. (Pre) 1997-98 
(a) a state 
(b) a union territory 
(c) An autonomous council 
(d) None of these 
52. Sikkim, a state of India was created by. 38th B.P.S.C. (Pre) 1999 
(a) Under the 30th Amendment 
POLITY POLITY BOOK  
(b) Under the 32nd Amendment 
(c) Under 35th Amendment 
(d) Under 42nd Amendment 
53. Sikkim became a full-fledged state of the Indian Union. 69th B.P.S.C. (Pre) 2023 
(a) in 1976 
(b) in 1974 
(c) in 1975 
(d) None of the above 
54. Sikkim became a full state of the Indian Union. 66th B.P.S.C. (Re-Exam) 2020 
(a) in 1974 
(b) in 1975 
(c) in 1976 
(d) None of the above 
55. It is possible to carve out Bihar and form a separate forest state. 43rd B.P.S.C. (Pre) 
1999 
(a) by passing a law in the state assembly 
(b) By passing an ordinance by the Governor 
(c) By ending the constitutional formality 
(d) none of these 
56. In which year was the reorganization of Indian states on the basis of language after 
independence? 64th B.P.S.C. (Pre) 2018 
(a) 1947 
(b) 1951 
(c) 1956 
(d) 2000 
(e) None of the above / More than one of the above 
CITIZENSHIP 
57. Indian citizenship cannot be obtained by. 41st B.P.S.C. (Pre) 1996 
(a) by birth 
(b) By naturalization 
(c) of any land area by insertion 
(d) By depositing money in an Indian bank 
58. When was the Citizenship (Amendment) Act passed? 66th B.P.S.C. (Pre) 2020 
POLITY POLITY BOOK  
(a) December 11, 2018 
(b) December 11, 2019 
(c) October 11, 2019 
(d) October 11, 2020 
(e) None of the above / more than one of the above 
59. What is the objective of the Citizenship (Amendment) Act, 2019? 67th B.P.S.C. (Pre) 
2022 
(a) Removal of Bangladeshi illegal immigrants 
(b) To identify genuine Indian citizens 
(c) To check border infiltration by foreigners 
(d) Providing citizenship to oppressed minority groups in Afghanistan, Bangladesh and 
Pakistan. 
(e) None of the above / More than one of the above 
FUNDAMENTAL RIGHTS 
60. Under which article in the Indian Constitution, fundamental rights have been provided to 
the citizens? 39th P.P.S.C. (Pre) 1994, 44th B.P.S.C. (Pre) 2000 
(a) Articles 112 to 115 
(b) Articles 12 to 35 
(c) Articles 222 to 235 
(d) none of these 
61. What does the right to constitutional remedies come under? B.P.S.C. (CDPO) (Pre) 
2018 
(a) Fundamental rights 
(b) legal rights 
(c) Constitutional Rights 
(d) Natural rights 
(e) None of the above / More than one of the above 
62. Which of the following writs is applicable against illegal detention of a person? B.P.S.C. 
(CDPO) (For) 2018 
(a) Realization of Ban 
(b) Mandate 
(c) Letter of Intent 
(d) Quo warranto 
(e) None of the above / More than one of the above 
63. Which of the following rights provided by the Indian Constitution is also available to 
non-citizens? 53-55th B.P.S.C. (Pre) 2011 
POLITY POLITY BOOK  
(a) Freedom of expression 
(b) Right to travel and settle in any part of the country 
(c) Right to acquire property 
(d) Right to constitutional resolution 
64. Select the fundamental rights which Indian citizens are eligible, but not to non-citizens 
B.P.C.S. (Pre) 2016  
I. 
II. 
III. 
IV. 
Freedom of speech and expression  
equality before law  
rights of minorities  
protection of life and liberty 
(a) I and III 
(b) I and IV 
(c) II and IV 
(d) II and III 
(e) None of the above / More than one of the above 
65. Which of the following fundamental rights is included in the Indian Constitution Is it not 
given to citizens? 42th B.P.S.C. (Pre) 1997 
(a) Constitutional right to retaliation 
(b) Right to property 
(c) Right to assemble peacefully 
(d) The right to move freely throughout the country 
66. During whose reign, Right to Property was removed from the list of fundamental rights? 
B.P.S.C. (CDPO) (Pre) 2005 
(a) Indira Gandhi 
(b) Charan Singh 
(c) Rajiv Gandhi 
(d) Morarji Desai 
67. According to the ruling of the Supreme Court, it is a fundamental right to hoist the 
national flag on private buildings. Every citizen under B.P.C.S. (Pre) 2016 
(a) Article 14 of the Constitution 
(b) Article 19 of the Constitution (1)a 
(c) Article 21 of the Constitution 
(d) Article 25 of the Constitution 
(e) None of the above / More than one of the above 
68. Which one of the following human rights is also a fundamental right under the Indian 
Constitution? B.P.S.C. (Pre) 2011 
POLITY POLITY BOOK  
(a) Right to Information 
(b) Right to work 
(c) Right to education 
(d) Right to house 
69. When was the right to education added by amending the Indian Constitution? 53-55th 
B.P.S.C. (Pre) 2011 
(a) April 1, 2010 
(b) August 1, 2010 
(c) October 1, 2010 
(d) 1 December, 2010 
70. When was the right to education established by amending the Indian Constitution added? 
C.D.P.O. 2018 
(a) April 1, 2010 
(b) August 1, 2010 
(c) October 1, 2010 
(d) 1 December, 2010 
71. Which of the following was added to the original list of fundamental rights? B.P.S.C. 
(CDPO) (Pre) 2005 
(a) Right to property 
(b) Right to constitutional remedies 
(c) Right to religious freedom 
(d) Right to free and compulsory primary education 
72. Which one of the following human rights is also a fundamental right under the Indian 
Constitution? 53-55th B.P.S.C. (Pre) 2011 
(a) Right to Information 
(b) Right to work 
(c) Right to education 
(d) Right to house 
73. Which of the following articles of the Constitution of India is related to the freedom of 
the press? 47th B.P.S.C. (Pre) 2005 
(a) Article 19 
(b) Article 20 
(c) Article 21 
(d) Article 22 
POLITY POLITY BOOK  
74. Which of the following constitutional remedies is also called 'postmortem'? 65 B.P.S.C. 
(Pre) 2019 
(a) prohibition 
(b) Mandate 
(c) Utterance 
(d) Quo warranto 
(e) None of the above / More than one of the above 
75. Who among the following has been given the power to enforce fundamental rights by the 
Constitution? 47th B.P.S.C. (Pre) 2005 
(a) To all the courts of India 
(b) to the Parliament 
(c) of the President 
(d) Supreme Court and High Courts 
DIRECTIVE PRINCIPLES OF STATE POLICY 
76. The concept of welfare state is included in the Constitution of India. 41th B.P.S.C. (Pre) 
1994 
• (a) Among the directive principles of state policy 
• (b) in the fourth schedule 
• (c) In fundamental rights 
• (d) in the introduction 
77. The ideal of a welfare state is described by. 39th B.P.S.C. (Pre) 1994 
(a) Among the directive principles of state policy 
(b) In the chapter of fundamental rights 
(c) In the Seventh Schedule of the Constitution 
(d) In the Preamble to the Constitution 
78. Directive Principles given in Part IV of the Indian Constitution Which of the following 
is/are listed in? 60th to 62th B.P.S.C. (Pre) 2016  
I. 
Equal pay for equal work  
II. 
III. 
IV. 
Uniform civil code 
Small family norm 
Mother tongue education at primary level 
(a) I, II and III 
(b) I and II 
(c) II and III 
(d) I, II and IV 
(e) None of the above / More than one of the above 
POLITY POLITY BOOK  
79. How are the Directive Principles of State Policy related to fundamental rights? 41th 
B.P.S.C. (Pre) 1996 
(a) The aforesaid is for the Central Government and the aforesaid is for the States 
(b) The above is not a part of the Constitution, whereas the above are 
(c) Directive Principles are not enforceable, whereas Fundamental Rights are enforceable 
(d) None of the above 
80. Which of the following articles directs state governments to constitute Panchayats? 64th 
B.P.S.C. (Pre) 2018 
(a) Article 33 
(b) Article 40 
(c) Article 48 
(d) Article 50 
• (e) None of the above / More than one of the above 
81. Match List-II with List-I and select the correct answer with the help of the code given 
below the lists. 66th B.P.S.C. (Pre) (Re-Exam) 2020  
List-I 
List-II 
A. Formation of Gram Panchayat 
1. Article 44 
B. Uniform Code of Conduct 
2. Article 48 
C. Agriculture and animal 
husbandry 
3. Article 50 
D. Separation of Judiciary and 
Executive 
4. Article 51 
E. Development of international 
peace 
5. Article 40 
Codes: A 
(a) 3 
(b) 5 
(c) 2 
(d) 1 
B 
4 
3 
3 
5 
C 
2 
2 
5 
3 
D 
1 
1 
4 
4 
E 
5 
4 
1 
2 
(e) None of the above / more than one of the above 
FUNDAMENTAL DUTY 
82. What is the name of the 10 conduct orders of the 42nd constitutional amendment known 
from? 45th B.P.S.C. (Pre) 2001 
POLITY POLITY BOOK  
(a) Fundamental rights 
(b) Fundamental Duties 
(c) Principles of Panchayati Raj 
(d) Directive Principles of State Policy 
83. By which constitutional amendment have the fundamental duties been added to the 
Constitution of India? 48th to 52 B.P.S.C. (Pre) 2008 
(a) 32nd Amendment Act 
(b) 42nd Constitutional Amendment 
(c) 15th Amendment Act 
(d) 46th Constitutional Amendment 
84. A new chapter has been added to the Indian Constitution by the 42nd Amendment Act 
(1976). 44th B.P.S.C. (Pre) 2000 
(a) Related to the administration of Union Territories 
(b) Creation of inter-state councils 
(c) Fundamental Duties 
(d) None of these 
85. Fundamental duties laid down 44th B.P.S.C. (Pre) 2000, 41th B.P.S.C. (Pre) 1996 
(a) By 40th amendment 
(b) By 43rd amendment 
(c) By 42nd amendment 
(d) By 39th amendment 
86. Which of the following is a fundamental duty in India? 45th B.P.S.C. (Pre) 2001-02 
(a) Separation of executive from judiciary 
(b) To preserve the rich heritage of our mixed culture. 
(c) Free and compulsory education for children 
(d) To end the tradition of untouchability. 
PRESIDENT 
87. The Executive Head of India is? 44th B.P.S.C. (Pre) 2000 
(a) The President 
(b) Prime Minister 
(c) Leader of the opposition party 
(d) Chief Secretary to the Government of India 
88. Executive power vested in the Central Government by the Constitution Has been done. 
65th B.P.S.C. (Re-Exam) (Pre) 2020 
POLITY POLITY BOOK  
(a) In the Constitution 
(b) In the President 
(c) In Governor 
(d) In the Prime Minister 
(e) None of the above / More than one of the above 
89. President- 64th B.P.S.C. (Pre) 2018 
(a) Is not a part of the Parliament. 
(b) Is part of the Parliament. 
(c) Is a part of the Parliament and sits in the Parliament. 
(d) Can vote in Parliament. 
(e) None of the above / More than one of the above 
90. The Supreme Commander of the Indian Defense Force is. B.P.S.C. (CDPO) (Pre) 2018 
(a) Chief of Army Staff of the Indian Army 
(b) President of India 
(c) Prime Minister of India 
(d) Defense Minister of India 
(e) None of the above / More than one of the above 
91. The President of India exercises his powers. 60th to 62th B.P.S.C. (Pre) 2016 
(a) (a) Directly or through his subordinate officers 
(b) (b) By ministers 
(c) (c) By the Prime Minister 
(d) (d) through the cabinet 
(e) (e) None of the above / More than one of the above 
92. How many times is the President of India eligible for re-election? 67th B.P.S.C. (Pre) 
Re-Exam, 2022 
(a) once 
(b) twice 
(c) three times 
(d) any number of times 
(e) None of the above / More than one of the above 
93. Who are included in the 'Electoral College' of the President of India? 66th B.P.S.C. (Re
Exam) 2020 
(a) All elected members of Rajya Sabha 
(b) All elected members of the Lok Sabha 
(c) All members of state assemblies 
POLITY POLITY BOOK  
(d) All elected members of both the Houses of Parliament and all elected members of 
State Legislative Assemblies 
(e) None of the above / More than one of the above 
94. In India, the President is elected by. 65th B.P.S.C. (Re-Exam) (Pre) 2020 
(a) By Rajya Sabha 
(b) By the people of India 
(c) By the members of both the houses of the Parliament 
(d) By Parliament and State Assemblies 
(e) None of the above / More than one of the above 
95. In India, the President is elected by- 44th B.P.S.C. (Pre) 2001 
(a) By direct election 
(b) By single transferable vote system 
(c) By proportional voting system 
(d) By open ballot system 
96. If there is any dispute in the election of the President of India, that dispute may be 
referred to. 38th B.P.S.C. 1992-93 
(a) To the Advocate General of India 
(b) to the Parliament 
(c) Supreme Court of India 
(d) none of these 
97. Consider the following statements regarding the President of India. B.P.S.C. (Assistant) 
2019 
1. Article 53 of the Constitution of India mentions that the executive power of the Union 
shall be vested in the President. 
2. The President shall hold office for five years after assuming office. 
3. Article 60 of the Constitution of India mentions the process of impeachment of the 
President.  
Which of the statements given above is/are correct? 
(a) Only 1 
(b) 1 and 2 only 
(c) 1, 2 and 3 
(d) 2 and 3 only 
98. If the posts of President and Vice President are vacant, then who holds the post of 
President of India? 48th to 52th B.P.S.C. (Pre) 2008 
POLITY POLITY BOOK  
(a) Prime Minister 
(b) Chief Justice of India 
(c) Lok Sabha Speaker 
(d) none of these 
99. If the post of President of India is vacant and the Vice President and the Chief Justice of 
India are not available, then who will be appointed President of India? B.P.S.C. (CDPO) 
(Pre) 2005 
(a) Attorney General of India 
(b) Speaker of the Lok Sabha 
(c) Senior judge of the Supreme Court 
(d) none of these 
100. The President of India can be removed from his post by. 39th B.P.S.C. (Pre) 1994, 47th 
B.P.S.C. (Pre) 2005 
(a) By the Prime Minister of India 
(b) By Lok Sabha 
(c) By the Chief Justice of India 
(d) by Parliament 
101. Executive powers of the Central Government in the Indian Constitution What is 
contained in? 42th B.P.S.C. (Pre) 1997-98 
(a) President of India 
(b) Prime Minister of India 
(c) Union Cabinet 
(d) all three 
102. The Indian Constitution does not give authority to the President of India. 38th B.P.S.C. 
(Pre) 1992-93 
(a) Appointment of Prime Minister 
(b) Appointment of Chief Minister of the states 
(c) To be the supreme commander of the defense forces. 
(d) To impose emergency in any part of the country 
103. The President of India does not have the right to 41th B.P.S.C. (Pre) 1996 
(a) donate forgiveness 
(b) Remove the judge of the Supreme Court 
(c) declare emergency 
(d) issue ordinance 
POLITY POLITY BOOK  
104. What is the order of Mrs. Pratibha Patil as the President of the Republic of India? 48th to 
52 B.P.S.C. (Pre) 2008, U.P. Lower Sub. (Pre) 2015 
(a) 10th 
(b) 11th 
(c) 12th 
(d) 13th 
105. India's first President Rajendra Prasad was from which state? 66th B.P.S.C. (Pre) (Re
Exam) 2020 
(a) Bihar 
(b) Haryana 
(c) Delhi 
(d) Uttar Pradesh 
(e) None of the above / More than one of the above 
106. The first President of independent India was. 44th B.P.S.C. (Pre) 2001-02 
(a) From Uttar Pradesh 
(b) From Andhra Pradesh 
(c) from Bihar 
(d) From Tamil Nadu 
107. A Bill which is presented in the Parliament becomes an Act after which action? 48th to 
52th B.P.S.C. (Pre) 2008 
(a) When it is passed by both the houses of the Parliament. 
(b) When the President gives his consent. 
(c) When the Prime Minister signs it. 
(d) When the Supreme Court declares it to be within the jurisdiction of the Union 
Parliament. 
VICE PRESIDENT 
108. The Chairman of which assembly is not its member? 48th to 52th B.P.S.C. (Pre) 2008 
(a) Rajya Sabha 
(b) Lok Sabha 
(c) Assembly 
(d) Legislative Council 
109. Who is the ex-officio Chairman of the Rajya Sabha? 63rd B.P.S.C. (Pre) Exam 2017 
(a) The President 
(b) Vice President 
POLITY POLITY BOOK  
(c) Prime Minister 
(d) None of the above 
(e) More than one of the above 
110. Who is the Chairman of Rajya Sabha? 45th B.P.S.C. (Pre) 2001-02 
(a) The President 
(b) Vice President 
(c) Prime Minister 
(d) Speaker of the Lok Sabha 
111. The Chairman of Rajya Sabha is 42th B.P.S.C. (Pre) 1997-98 
(a) Vice President of India 
(b) Chief Justice of the Supreme Court 
(c) Chief Election Commissioner 
(d) Prime Minister of India 
112. Which statement is false? 38th B.P.S.C. (Pre) 1992-93 
(a) The age of a candidate for the post of President should be at least 35 years. 
(b) The Vice President becomes the Chairman of the Rajya Sabha. 
(c) The Vice President is elected by the President of India. 
(d) The first President of India was Dr. Rajendra Prasad. 
113. How many members are there in the electoral college for the 16th Vice President of India 
election in 2022? 67th B.P.S.C. (Pre) Re-Exam 2022 
(a) 798 
(b) 788 
(c) 545 
(d) 250 
(e) None of the above / More than one of the above 
114. The number of Shri Mohammad Hamid Ansari as the Vice President of India is. 48th to 
52th B.P.S.C. (Pre) 2008 
(a) 10th 
(b) 11th 
(c) 12th 
(d) 13th 
35. 
The Prime Minister of India is. 47th B.P.S.C. (Pre) 2005 
(a) State Government 
(b) Central Government 
POLITY POLITY BOOK  
(c) Both state and central government 
(d) None of the above 
116. Usually the Prime Minister of India is. 47th B.P.S.C. (Pre) 2005 
(a) Not a member of Parliament 
(b) Member of Lok Sabha 
(c) Member of Rajya Sabha 
(d) Member of both the houses 
117. To whom is the Prime Minister of India answerable? 63th B.P.S.C. (Pre) 2017 
(a) Cabinet 
(b) President 
(c) Lok Sabha 
(d) Rajya Sabha 
(e) None of the above / More than one of the above 
118. Ministers of the Union Council of Ministers are collectively responsible. 41th B.P.S.C. 
(Pre) 1996 
(a) To the Prime Minister 
(b) To the President 
(c) To the Parliament 
(d) Only towards Lok Sabha 
119. The Council of Ministers is responsible 40th B.P.S.C. (Pre) 1995 
(a) To the President 
(b) To the Prime Minister 
(c) To the Chairman (Rapikar) 
(d) To the Parliament 
35. 
In the Indian political system, the executive works under subordination. 45th B.P.S.C. 
(Pre) 2001 
(a) Judiciary 
(b) legislature 
(c) Election Commission 
(d) Union Public Service Commission 
121. By which of the following Constitutional Amendment Acts, the number of Council of 
Ministers has been fixed at the limit of 15 percent of the total members of the Lok Sabha? 
66th B.P.S.C. (Pre) (Re-Exam) 2020 
(a) 95th Constitutional Amendment Act, 2009 
POLITY POLITY BOOK  
(b) 93rd Constitutional Amendment Act, 2005 
(c) 91st Constitutional Amendment Act, 2003 
(d) 10th Constitutional Amendment Act, 2003 
(e) None of the above / More than one of the above 
122. Who has recently been given the charge of the Ministry of Minority Affairs? 67th 
B.P.S.C. (Pre) (Re-Exam) 2022 
(a) Smriti Irani 
(b) Amit Shah 
(c) Nirmala Sitharaman 
(d) Piyush Goyal 
(e) None of the above / More than one of the above 
123. Who is the highest civil service officer in the Central Government? 63th B.P.S.C. (Pre) 
2017 
(a) Attorney General of India 
(b) Cabinet Secretary 
(c) Home Secretary 
(d) Finance Secretary 
(e) None of the above / more than one of the above 
124. Who is the head of the National Security Committee? 53rd to 55th B.P.S.C. (Pre) 2011 
(a) Home Minister 
(b) Prime Minister 
(c) President 
(d) Vice President 
ATTORNEY GENERAL, ADVOCATE GENERAL AND COMPTROLLER AND 
AUDITOR GENERAL 
125. Who advises the Government of India on legal matters? 44th B.P.S.C. (Pre) 2000 
(a) Attorney General 
(b) Chief Justice of the Supreme Court 
(c) Chairman of the Law Commission 
(d) None of these 
126. By whom is the Attorney General of India appointed? 64th B.P.S.C. (Pre) 2018 
(a) Law Minister 
(b) President of India 
(c) Speaker of the Lok Sabha 
(d) Prime Minister 
POLITY POLITY BOOK  
(e) None of the above / More than one of the above 
127. Which officer of the Government of India, despite not being a member, has the right to 
participate in the proceedings of the Indian Parliament? 60th to 62th B.P.C.S. (Pre) 
2016 
(a) Vice President 
(b) Attorney General 
(c) Comptroller and Auditor General (सीएजी - Devanagari Script for CAG) 
(d) Election Commissioner 
(e) None of the above / More than one of the above 
128. A person may take part in the proceedings of either House of Parliament as a non
member - 48th to 52th B.P.S.C. (Pre) 2008 
(a) Vice President 
(b) Chief Justice 
(c) Attorney General 
(d) Chief Election Commissioner 
PRIORITY ORDER 
129. Who among the following comes first in the order of preference of India? 65th B.P.S.C. 
(Pre) 2019 
(a) Chairman of UPSC 
(b) Chief Electoral Commissioner 
(c) Comptroller and Auditor General 
(d) Chief Justice of the High Court 
(e) None of the above / more than one of the above 
130. Arrange the following words in a logical and meaningful order. 68th B.P.S.C. (Pre) 2023 
1. Vice President 
2. The President 
3. Chairman 
4. Prime Minister 
5. Member of Parliament 
(a) 5, 1, 2, 3, 4 
(b) 4, 2, 1, 3, 5 
(c) 2, 1, 4, 3, 5 
(d) More than one of the above 
(e) None of the above 
POLITY POLITY BOOK  
PARLIAMENT 
LOK SABHA 
131. The minimum age limit for a person to be elected in an election to the Lok Sabha is 45th 
B.P.S.C. (Pre) 2001-02 
(a) 18 years 
(b) 21 years 
(c) 25 years 
(d) none of these 
132. What age should a person not be below to be elected as a member of the Lok Sabha? 
64th B.P.S.C. (Pre) 2018 
(a) 18 years 
(b) 21 years 
(c) 25 years 
(d) 30 years 
(e) None of the above / More than one of the above 
133. What is the minimum age to become a Member of Parliament? 63rd B.P.S.C. (Pre) 2017 
(a) 18 years 
(b) 21 years 
(c) 25 years 
(d) 30 years 
(e) None of the above / More than one of the above 
134. State-wise allocation of seats in the Lok Sabha is based on the 1971 census. Till how 
many years will this determination remain the same? 47th B.P.S.C. (Pre) 2005 
(a) 2031 
(b) 2026 
(c) 2021 
(d) 2011 
135. Lok Sabha seats in each state are determined by the Delimitation Commission. This 
delimitation has been stopped till which year? 67th B.P.S.C. (Pre) Re-Exam, 2022 
(a) 2024 
(b) 2025 
(c) 2026 
(d) 2027 
(e) None of the above / More than one of the above 
POLITY POLITY BOOK  
136. The allocation of seats for each state in the present Lok Sabha is based on. 42th B.P.S.C. 
(Pre) 1997 
(a) On 1951 census 
(b) On 1961 census 
(c) On 1971 census 
(d) On 1981 census 
137. Who has the power to nominate members from the Anglo-Indian community in the Lok 
Sabha? 44th B.P.S.C. (Pre) 2000 
(a) minority 
(b) President of India 
(c) Prime Minister 
(d) Vice President 
138. The Lok Sabha can be dissolved before the expiry of its term. 40th B.P.S.C. (Pre) 1995 
(a) By the President, as per his wish 
(b) By the Speaker 
(c) By the President, on the advice of the Council of Ministers 
(d) By the President, on the advice of the Speaker 
139. Lok Sabha can be dissolved before the completion of its term. 42th B.P.S.C. (Pre) 1997
98 
(a) By the President at his discretion 
(b) By the Prime Minister at his discretion 
(c) By the Speaker of the Lok Sabha at his discretion 
(d) By the President on the recommendation of the Prime Minister 
140. How many sessions are there normally in the Lok Sabha? 67th B.P.S.C. (Pre) Re-Exam, 
2022, 66th B.P.S.C. (Pre) Re-Exam, 2020 
(a) 3 
(b) 4 
(c) 5 
(d) 6 
(e) None of the above / More than one of the above 
141. At least how many sessions of the Lok Sabha are called? 42th B.P.S.C. (Pre) 1997-98 
(a) once a year 
(b) twice a year 
(c) thrice a year 
(d) four times a year 
POLITY POLITY BOOK  
142. There should be maximum gap between two sessions of Parliament. 39th B.P.S.C. (Pre) 
1994 
(a) four months old 
(b) six months 
(c) one year old 
(d) The time fixed by the President 
143. Which state sends the maximum number of representatives to the Lok Sabha? 42nd 
B.P.S.C. (Pre) 1997–98 
(a) Bihar 
(b) Madhya Pradesh 
(c) West Bengal 
(d) Uttar Pradesh 
144. As far as representation in the Lok Sabha is concerned, which states are in the second and 
third ranks? 39th B.P.S.C. (Pre) 1994 
(a) Bihar and Maharashtra 
(b) Madhya Pradesh and Namil Nadu 
(c) Madhya Pradesh and Maharashtra 
(d) Bihar and Madhya Pradesh 
145. A candidate for Lok Sabha elections loses his deposit if he cannot get it. 40th B.P.S.C. 
(Pre) 1995 
(a) 1/3 of valid votes 
(b) 1/4 of valid votes 
(c) 1/5 of valid votes 
(d) None of the above 
146. When were the first general elections of the Lok Sabha held? 42th B.P.S.C. (Pre) 1997
98 
(a) in 1949 
(b) in 1952 
(c) in 1950 
(d) in 1954 
147. When was the Ninth Lok Sabha dissolved? 42th B.P.S.C. (Pre) 1997 
(a) March, 1991 
(b) June, 1996 
(c) April, 1997 
(d) February, 1998 
POLITY POLITY BOOK  
148. Elections for the 12th Lok Sabha were held in India 42th B.P.S.C. (Pre) 1997 
(a) In April, 1996 
(b) In June, 1996 
(c) In April, 1997 
(d) In February, 1998 
149. Who is the leader of Lok Sabha? 40th B.P.S.C. (Pre) 1995 
(a) The President 
(b) Prime Minister 
(c) Chairman 
(d) None of the above 
150. The Speaker of the Lok Sabha is elected by. 39th B.P.S.C. (Pre) 1994 
(a) By all the members of Parliament 
(b) Directly by the public 
(c) By all the members of the Lok Sabha 
(d) By the members of the party having majority in the Lok Sabha 
151. The current Deputy Speaker of the Lok Sabha is 43rd B.P.S.C. (Pre) 1999 
(a) Po. M. Saeed 
(b) Mrs. Najma Heptulla 
(c) Shri G.M.C. Balyogi 
(d) none of these 
152. Money Bill can be introduced by. 63rd B.P.S.C. (Pre) 2017 
(a) Only in the Lok Sabha 
(b) Only in Rajya Sabha 
(c) In both Lok Sabha and Rajya Sabha 
(d) In the joint session of both Lok Sabha and Rajya Sabha 
(e) None of the above / More than one of the above 
153. Who controls the expenditure of the Parliament of India? B.P.S.C. (CDPO) (Pre) 2018 
(a) Niti Aayog 
(b) Reserve Bank of India 
(c) Finance Commission 
(d) Comptroller and Auditor General 
(e) None of the above / More than one of the above 
154. Who presides over the joint session of Parliament? 65th B.P.S.C. (Re-Exam) (Pre) 2020 
POLITY POLITY BOOK  
(a) The President 
(b) Vice President 
(c) Speaker of the Lok Sabha 
(d) Prime Minister 
(e) None of the above / More than one of the above 
155. An M.P. The seat of a Speaker can be declared vacant if he remains continuously absent 
from the House for a period of. 60 to 62 B.P.S.C. (Pre) 2016 
(a) 6 months 
(b) 2 months 
(c) 3 months 
(d) one year 
(e) None of the above / More than one of the above 
156. The Prime Minister of India is. 47th B.P.S.C. (Pre) 2005 
(a) State Government 
(b) Central Government 
(c) Both state and central government 
(d) None of the above 
RAJYA SABHA 
157. Rajya Sabha consists of. 53rd to 55th B.P.S.C. (Pre) 2011 
(a) 280 members, of which 20 are the President of India are nominated by. 
(b) 275 members, of whom 18 members are nominated by the President of India. 
(c) 250 members, of whom 12 members are nominated by the President of India. 
(d) 252 members, out of which 12 members are nominated by the President of India. 
158. Representation in the Rajya Sabha includes. 68th B.P.S.C. (Pre) 2023 
(a) Member nominated by the President of India 
(b) Members elected directly by the citizens 
(c) Indirectly by the citizens through their representatives members elected through 
(d) More than one of the above 
(e) None of the above 
159. According to our Constitution, the tenure of the Rajya Sabha is 48th to 52nd B.P.S.C. 
(Pre) 2008 
(a) Expires once in two years. 
(b) Expires every five years. 
(c) Expires every six years. 
(d) Not subject to termination. 
POLITY POLITY BOOK  
160. Which of the following statements is not correct. 53rd to 55th B.P.S.C. (Pre) 2011 
(a) Rajya Sabha is powerless in matters of money and property. 
(b) Money Bill originates in Rajya Sabha. 
(c) Rajya Sabha has to pass bills within 14 days after they are passed by the Lok Sabha. 
(d) Rajya Sabha can pass a Money Bill or return it to the Lok Sabha with certain 
recommendations. 
161. The word Cabinet has been used only once in the Constitution and that is 41th B.P.S.C. 
(Pre) 1996 
(a) In Article 352 
(b) In Article 74 
(c) In Article 356 
(d) In Article 76 
162. On which of the following basis is representation given to the states in the Rajya Sabha? 
38th B.P.S.C. (Pre) 1993 
(a) Equal for each state 
(b) Places in proportion to their population 
(c) Space in proportion to their area 
(d) Position in proportion to their revenue 
163. Members of Rajya Sabha elected 42nd B.P.S.C. (Pre) 1997-98 
(a) for four years 
(b) for five years 
(c) for six years 
(d) lifelong 
164. Rajya Sabha is called the permanent house because 47th B.P.S.C. (Pre) 2005, 41st 
B.P.S.C. (Pre) 1996 
(a) All members are life members. 
(b) It cannot be decomposed. 
(c) Some members retire every two years. 
(d) Both (b) and (c) are correct. 
165. Who has the right to dissolve the Rajya Sabha? 40th B.P.S.C. (Pre) 1995 
(a) The President 
(b) Vice President 
(c) Supreme Court 
(d) None of the above 
POLITY POLITY BOOK  
166. In political terminology, zero hour means. 45th B.P.S.C. (Pre) 2001-02 
(a) The day when no work is done in Parliament 
(b) Suspended Motion 
(c) moratorium period 
(d) Question-answer session 
167. A joint session of both the Houses of Parliament is held 40th B.P.S.C. (Pre) 1995 
1. For the election of the President of India 
2. For the election of the Vice President of India 
3. To pass a bill related to amendment in the Constitution 
4. To consider and pass a bill on which there is difference of opinion between the two 
houses.  
choose your answer from the following codes: 
(a) 1 and 4 
(b) 3 and 4 
(c) 1 and 2 
(d) only 4 
168. How many members can the President nominate for the Lok Sabha and the Rajya Sabha 
respectively? B.P.S.C. (CDPO) 2005 
(a) 12, 2 
(b) 2, 12 
(c) 2, 10 
(d) 10, 2 
169. How many persons are nominated by the President to the Rajya Sabha? 41st B.P.S.C. 
(Pre) 1996, 2005 
(a) 10 
(b) 15 
(c) 12 
(d) 20 
170. Who is vested with the power to issue ordinances during the prorogation of Parliament? 
B.P.S.C. (CDPO) 2005 
(a) Council of Ministers 
(b) Legislative Committee of the urgent Parliament 
(c) President 
(d) Prime Minister 
POLITY POLITY BOOK  
171. According to Article 110 of the Indian Constitution, what is included in the definition of 
Money Bill? 66th B.P.S.C. (Re-Exam) 2020 
(a) Reversion to imposition, abolition and regulation of tax 
(b) To regulate the lending of money 
(c) To appropriate the money of the Consolidated Fund of India 
(d) Giving details of expenditure from the Consolidated Fund of India 
(e) None of the above / More than one of the above 
PARLIAMENTARY COMMITTEES 
172. Vote on Account is made 60th to 62th B.P.S.C. (Pre) 2016 
(a) To vote on the CAG report 
(b) To meet unexpected expenses 
(c) For allocation of funds pending passage of the budget. 
(d) For Chavat 
(e) None of the above / More than one of the above 
173. The Public Accounts Committee submits its report 
(a) to the Comptroller and Auditor General 
(b) To the Speaker of the Lok Sabha 
(c) To the Minister of Parliamentary Affairs 
(d) To the President of India 
174. Which of the following parliamentary committees is related to the power delegated to the 
executive to make rules and regulations? 67th B.P.S.C. (Pre) 2022 
(a) Committee on Executive Legislation 
(b) Committee on Subordinate Legislation 
(c) Committee on Administrative Legislation 
(d) Committee on Delegated Legislation 
(e) None of the above / More than one of the above 
175.'What is the purpose of 'cut motion'? 66th B.P.S.C. (Re-Exam) 2020 
(a) To control the policies of the government 
(b) Stopping the proceedings of the ruling party 
(c) To submit proposal for reduction in expenditure of budget proposals. 
(d) Canceling all financial transactions of the government 
(e) None of the above / More than one of the above 
PARLIAMENTARY ACT 
POLITY POLITY BOOK  
176. In which year was the reorganization of Indian states on the basis of language after 
independence? 64th B.P.S.C. (Pre) 2018 
(a) 1947 
(b) 1951 
(c) 1956 
(d) 2000 
(e) None of the above / More than one of the above 
177. Manipur state was formed by. 65th B.P.S.C. (Re-Exam) (Pre) 2020 
(a) in 1972 
(b) in 1987 
(c) in 1985 
(d) in 1963 
(e) None of the above /More than one of the above 
178. Which of the following statements is not correct regarding consumer dispute resolution at 
the district level in India? 68th B.P.S.C. (Pre) 2023 
(a) The District Forum considers complaints where the value of goods or services does 
not exceed fifty lakh rupees. 
(b) The State Government may, if it deems appropriate, establish more than one District 
Forum in a district. 
(c) One of the members of the District Forum will be a woman 
(d) More than one of the above 
(e) None of the above 
179. Which of the following is the 28th state of the Indian Union? B.P.S.C. (CDPO) (For) 
2005 
(a) Uttarakhand 
(b) Jharkhand 
(c) Chhattisgarh 
(d) none of these 
SUPREME COURT 
180. Supreme Court one. 67th B.P.S.C. (Pre) Re-Exam, 2022 
(a) is a federal court. 
(b) Is a protector of human rights. 
(c) Is the final arbiter of the Constitution. 
(d) There is a civil court. 
(e) None of the above / More than one of the above 
POLITY POLITY BOOK  
181. The Supreme Court of India was established. 42nd B.P.S.C. (Pre) 1997-98 
(a) By an Act of Parliament in 1950 
(b) Under the Indian Independence Act, 1947 
(c) Under the Government of India Act, 1953 
(d) By the Indian Constitution 
182. Sanctioned competence of judges in the Supreme Court of India what is (Sanction 
Strength)? 38th B.P.S.C. (Pre) 1992-93 
(a) 24 
(b) 20 
(c) 18 
(d) 0 (None of these) 
183. At present, the number of judges of the Supreme Court is. 65th B.P.S.C. (Re-Exam) 
(Pre) 2020 
(a) 15 
(b) 25 
(c) 31 
(d) 20 
(e) None of the above / More than one of the above 
184. Who appoints the judges in the Supreme Court of India? 63rd B.P.S.C. (Pre) 2017 
(a) Prime Minister 
(b) President 
(c) Chief Justice of India 
(d) Lokpal 
(e) None of the above / More than one of the above 
185. To whom can a judge of the Supreme Court write a letter of resignation from his post? 
64th B.P.S.C. (Pre) 2018 
(a) The President 
(b) Prime Minister 
(c) Law Minister 
(d) Attorney General of India 
(e) None of the above / more than one of the above 
186. What is the retirement age of Supreme Court judges? 63rd B.P.S.C. (Pre) 2017 
(a) 60 years 
(b) 62 years 
(c) 65 years 
POLITY POLITY BOOK  
(d) 70 years 
(e) None of the above / more than one of the above 
187. Who has the power to increase the number of judges of the Supreme Court? 44th 
B.P.S.C. (Pre) 2000 
(a) Prime Minister 
(b) President 
(c) Parliament 
(d) Law Ministry 
188. Regarding the collegium system, consider the following statements 69th B.P.S.C. (Pre) 
2023 
1. The Supreme Court Collegium is a five-member body. It is headed by the current 
Chief Justice of India (CJI) and includes the four other senior-most judges serving in 
the court at that time. 
2. Parliament started the collegium system by law 
3. The appointment of judges of the Supreme Court and High Courts is done only 
through the collegium system. 
4. The collegium system was introduced in the year 1993 to commemorate the historic 
first instance case of Justice PN Bhagwati.  
Which of the above statements is/are correct? 
(a) 1 and 3 
(b) Only 1 
(c) 1 and 2 
(d) 3 and 4 
189. Which one of the following statements is not correct? B.P.S.C. (Pre) 2011 
(a) The Supreme Court was formed in 1950. 
(b) The Supreme Court is the highest court in the country, to which appeals lie. 
(c) The Supreme Court can hear any High Court/Courts other than the Court Martial. 
(d) The Supreme Court can hear the Court Martial along with any other High 
Court/Courts. 
190. Which of the following is related to the Supreme Court of India? 68th B.P.S.C. (Pre) 
2022 
(a) Collegium system
`;

async function exportAuditJson() {
  const buffer = Buffer.from(fullPastedText, 'utf-8');
  const doc = await AdapterFactory.process(buffer, { filename: 'POLITY_ALL_PYQ_ENG.txt', mimeType: 'text/plain' });
  const qnas = await QnaExtractor.extractQna(doc);

  const auditData = qnas.map((q, idx) => {
    return {
      index: idx + 1,
      questionNumber: q.questionNumber || idx + 1,
      sectionName: q.metadata?.sectionHeader || 'GENERAL',
      questionType: q.questionType || 'MCQ',
      questionText_en: q.question.versions.find(v => v.language === 'en')?.text || '',
      questionText_hi: q.question.versions.find(v => v.language === 'hi')?.text || '',
      optionsCount: q.options.length,
      options: q.options.map(opt => {
        const enVer = opt.versions.find(v => v.language === 'en');
        const hiVer = opt.versions.find(v => v.language === 'hi');
        const primaryText = opt.versions[0]?.text || '';
        return {
          label: opt.label,
          text_en: enVer?.text || (opt.versions[0]?.language !== 'hi' ? primaryText : ''),
          text_hi: hiVer?.text || (opt.versions[0]?.language === 'hi' ? primaryText : '')
        };
      }),
      correctAnswer: q.answer.values[0] || null,
      explanation_en: q.explanation.versions.find(v => v.language === 'en')?.text || '',
      explanation_hi: q.explanation.versions.find(v => v.language === 'hi')?.text || '',
      confidenceScore: q.confidence,
      validationStatus: q.validation.status
    };
  });

  const outputPath = path.join(__dirname, 'extracted_questions_audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditData, null, 2), 'utf-8');
  console.log(`✅ Audit JSON successfully exported to: ${outputPath} (${auditData.length} questions)`);
}

exportAuditJson();
