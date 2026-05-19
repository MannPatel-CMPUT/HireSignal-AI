import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Trash2, Save, FileText, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [resume, setResume] = useState({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: []
    },
    projects: [],
    certifications: []
  });

  const updatePersonal = (field, value) => {
    setResume(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', position: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }
      ]
    }));
  };

  const updateExperience = (index, field, value) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const addBullet = (expIndex) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIndex].bullets.push('');
      return { ...prev, experience: newExp };
    });
  };

  const updateBullet = (expIndex, bulletIndex, value) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIndex].bullets[bulletIndex] = value;
      return { ...prev, experience: newExp };
    });
  };

  const removeBullet = (expIndex, bulletIndex) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIndex].bullets.splice(bulletIndex, 1);
      return { ...prev, experience: newExp };
    });
  };

  const removeExperience = (index) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { school: '', degree: '', field: '', location: '', graduationDate: '', gpa: '' }
      ]
    }));
  };

  const updateEducation = (index, field, value) => {
    setResume(prev => {
      const newEdu = [...prev.education];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, education: newEdu };
    });
  };

  const removeEducation = (index) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (type, skill) => {
    if (!skill.trim()) return;
    setResume(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: [...prev.skills[type], skill.trim()]
      }
    }));
  };

  const removeSkill = (type, index) => {
    setResume(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: prev.skills[type].filter((_, i) => i !== index)
      }
    }));
  };

  const generateResumeText = () => {
    let text = '';
    
    // Personal Info
    text += `${resume.personal.fullName}\n`;
    if (resume.personal.email) text += `${resume.personal.email} | `;
    if (resume.personal.phone) text += `${resume.personal.phone} | `;
    if (resume.personal.location) text += `${resume.personal.location}\n`;
    if (resume.personal.linkedin) text += `LinkedIn: ${resume.personal.linkedin} | `;
    if (resume.personal.portfolio) text += `Portfolio: ${resume.personal.portfolio}`;
    text += '\n\n';

    // Summary
    if (resume.summary) {
      text += `PROFESSIONAL SUMMARY\n${resume.summary}\n\n`;
    }

    // Experience
    if (resume.experience.length > 0) {
      text += 'WORK EXPERIENCE\n';
      resume.experience.forEach(exp => {
        text += `\n${exp.position} | ${exp.company}${exp.location ? ', ' + exp.location : ''}\n`;
        text += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
        exp.bullets.forEach(bullet => {
          if (bullet.trim()) text += `• ${bullet}\n`;
        });
      });
      text += '\n';
    }

    // Education
    if (resume.education.length > 0) {
      text += 'EDUCATION\n';
      resume.education.forEach(edu => {
        text += `\n${edu.degree}${edu.field ? ' in ' + edu.field : ''} | ${edu.school}${edu.location ? ', ' + edu.location : ''}\n`;
        if (edu.graduationDate) text += `Graduation: ${edu.graduationDate}`;
        if (edu.gpa) text += ` | GPA: ${edu.gpa}`;
        text += '\n';
      });
      text += '\n';
    }

    // Skills
    if (resume.skills.technical.length > 0 || resume.skills.soft.length > 0) {
      text += 'SKILLS\n';
      if (resume.skills.technical.length > 0) {
        text += `Technical: ${resume.skills.technical.join(', ')}\n`;
      }
      if (resume.skills.soft.length > 0) {
        text += `Soft Skills: ${resume.skills.soft.join(', ')}\n`;
      }
      text += '\n';
    }

    return text;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/resume-drafts`,
        { content: resume },
        { withCredentials: true }
      );
      toast.success('Resume draft saved!');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    const resumeText = generateResumeText();
    if (!resumeText.trim()) {
      toast.error('Please add some content to your resume first');
      return;
    }

    setAnalyzing(true);
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/analyze`,
        {
          resume_text: resumeText,
          job_description: 'General analysis - optimizing for ATS compatibility',
          experience_level: 'Mid-Level',
          tone_preference: 'Professional'
        },
        { withCredentials: true }
      );
      toast.success('Analysis complete!');
      navigate(`/results/${data.id}`);
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    const text = generateResumeText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    a.click();
    toast.success('Resume exported!');
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-4xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              data-testid="builder-title"
            >
              Resume Builder
            </h1>
            <p className="text-zinc-600">Create an ATS-optimized resume with guided tips</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
              data-testid="export-button"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              variant="outline"
              className="gap-2"
              data-testid="save-draft-button"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-black text-white hover:bg-zinc-800 gap-2"
              data-testid="analyze-from-builder-button"
            >
              <Sparkles className="h-4 w-4" />
              {analyzing ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
                <TabsTrigger value="experience" data-testid="tab-experience">Experience</TabsTrigger>
                <TabsTrigger value="education" data-testid="tab-education">Education</TabsTrigger>
                <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={resume.personal.fullName}
                    onChange={(e) => updatePersonal('fullName', e.target.value)}
                    className="mt-1"
                    data-testid="input-fullname"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={resume.personal.email}
                      onChange={(e) => updatePersonal('email', e.target.value)}
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={resume.personal.phone}
                      onChange={(e) => updatePersonal('phone', e.target.value)}
                      className="mt-1"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={resume.personal.location}
                    onChange={(e) => updatePersonal('location', e.target.value)}
                    className="mt-1"
                    placeholder="City, State"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={resume.personal.linkedin}
                    onChange={(e) => updatePersonal('linkedin', e.target.value)}
                    className="mt-1"
                    placeholder="linkedin.com/in/yourprofile"
                    data-testid="input-linkedin"
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio">Portfolio/Website</Label>
                  <Input
                    id="portfolio"
                    value={resume.personal.portfolio}
                    onChange={(e) => updatePersonal('portfolio', e.target.value)}
                    className="mt-1"
                    data-testid="input-portfolio"
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={resume.summary}
                    onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
                    rows={5}
                    className="mt-1"
                    placeholder="2-3 sentences highlighting your experience and value proposition"
                    data-testid="input-summary"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    💡 Tip: Focus on achievements and skills relevant to your target role
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="experience" className="mt-6 space-y-6">
                {resume.experience.map((exp, expIndex) => (
                  <div key={expIndex} className="border border-zinc-200 rounded-lg p-4" data-testid={`experience-${expIndex}`}>
                    <div className="flex justify-between mb-4">
                      <h3 className="font-semibold">Experience {expIndex + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(expIndex)}
                        className="text-red-600"
                        data-testid={`remove-experience-${expIndex}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Position *</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => updateExperience(expIndex, 'position', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Company *</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                            placeholder="MM/YYYY"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            value={exp.endDate}
                            onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                            placeholder="MM/YYYY"
                            disabled={exp.current}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={exp.location}
                            onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(expIndex, 'current', e.target.checked)}
                          />
                          Currently working here
                        </Label>
                      </div>
                      <div>
                        <Label>Achievements & Responsibilities</Label>
                        {exp.bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex gap-2 mt-2">
                            <Textarea
                              value={bullet}
                              onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                              rows={2}
                              className="flex-1"
                              placeholder="Start with an action verb, include metrics if possible"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBullet(expIndex, bulletIndex)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBullet(expIndex)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Bullet
                        </Button>
                        <p className="text-xs text-zinc-500 mt-2">
                          💡 Tip: Use action verbs (Led, Developed, Increased) and quantify results (20% improvement, $50K savings)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={addExperience}
                  className="w-full"
                  variant="outline"
                  data-testid="add-experience-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </TabsContent>

              <TabsContent value="education" className="mt-6 space-y-6">
                {resume.education.map((edu, index) => (
                  <div key={index} className="border border-zinc-200 rounded-lg p-4" data-testid={`education-${index}`}>
                    <div className="flex justify-between mb-4">
                      <h3 className="font-semibold">Education {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-red-600"
                        data-testid={`remove-education-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>School *</Label>
                          <Input
                            value={edu.school}
                            onChange={(e) => updateEducation(index, 'school', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Degree *</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="Bachelor's, Master's, etc."
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Field of Study</Label>
                          <Input
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Graduation Date</Label>
                          <Input
                            value={edu.graduationDate}
                            onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                            placeholder="MM/YYYY"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={edu.location}
                            onChange={(e) => updateEducation(index, 'location', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>GPA (optional)</Label>
                          <Input
                            value={edu.gpa}
                            onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                            placeholder="3.8/4.0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={addEducation}
                  className="w-full"
                  variant="outline"
                  data-testid="add-education-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </TabsContent>

              <TabsContent value="skills" className="mt-6 space-y-6">
                <div>
                  <Label>Technical Skills</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g., Python, React, AWS"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSkill('technical', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      data-testid="input-technical-skill"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Press Enter to add</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {resume.skills.technical.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        data-testid={`technical-skill-${index}`}
                      >
                        {skill}
                        <button onClick={() => removeSkill('technical', index)} className="hover:text-blue-900">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    💡 Tip: Include programming languages, frameworks, tools, and technologies relevant to your field
                  </p>
                </div>

                <div>
                  <Label>Soft Skills</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g., Leadership, Communication"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSkill('soft', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      data-testid="input-soft-skill"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Press Enter to add</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {resume.skills.soft.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        data-testid={`soft-skill-${index}`}
                      >
                        {skill}
                        <button onClick={() => removeSkill('soft', index)} className="hover:text-emerald-900">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    💡 Tip: Highlight transferable skills like communication, problem-solving, and teamwork
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-24 self-start">
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Live Preview
            </h3>
            <div
              className="bg-zinc-50 rounded-lg p-6 min-h-[500px] font-mono text-sm whitespace-pre-wrap"
              data-testid="resume-preview"
            >
              {generateResumeText() || 'Your resume will appear here as you fill out the form...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;