import { contactParserService } from '../services/contact-parser.service';

const testScenarios = [
  {
    name: '1. Clear Card',
    input: {
      rawText: "John Doe\nSoftware Engineer\nGoogle LLC\n+1 650 253 0000\njohndoe@google.com\nwww.google.com\n1600 Amphitheatre Pkwy, Mountain View, CA 94043",
      lines: [
        { text: "John Doe", confidence: 1 },
        { text: "Software Engineer", confidence: 1 },
        { text: "Google LLC", confidence: 1 },
        { text: "+1 650 253 0000", confidence: 1 },
        { text: "johndoe@google.com", confidence: 1 },
        { text: "www.google.com", confidence: 1 },
        { text: "1600 Amphitheatre Pkwy, Mountain View, CA 94043", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      name: "John Doe",
      designation: "Software Engineer",
      company: "Google LLC",
      phone: "+16502530000",
      email: "johndoe@google.com",
      website: "google.com",
      officeAddress: "1600 Amphitheatre Pkwy, Mountain View, CA 94043"
    }
  },
  {
    name: '2. Small Text (High density)',
    input: {
      rawText: "Jane Smith\nProject Manager\nMicrosoft Corp\n+91 9876543210\njane.smith@microsoft.com\nRedmond, WA 98052",
      lines: [
        { text: "Jane Smith", confidence: 1 },
        { text: "Project Manager", confidence: 1 },
        { text: "Microsoft Corp", confidence: 1 },
        { text: "+91 9876543210", confidence: 1 },
        { text: "jane.smith@microsoft.com", confidence: 1 },
        { text: "Redmond, WA 98052", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      name: "Jane Smith",
      designation: "Project Manager",
      company: "Microsoft Corp",
      phone: "+919876543210",
      email: "jane.smith@microsoft.com",
      officeAddress: "Redmond, WA 98052"
    }
  },
  {
    name: '3. Multiple Phones',
    input: {
      rawText: "Alice Johnson\nDirector\nApple Inc\nCell: +1 408 555 1234\nOffice: +1 408 555 5678\nFax: +1 408 555 9999\nalice@apple.com",
      lines: [
        { text: "Alice Johnson", confidence: 1 },
        { text: "Director", confidence: 1 },
        { text: "Apple Inc", confidence: 1 },
        { text: "Cell: +1 408 555 1234", confidence: 1 },
        { text: "Office: +1 408 555 5678", confidence: 1 },
        { text: "Fax: +1 408 555 9999", confidence: 1 },
        { text: "alice@apple.com", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      phonesCount: 3,
      cell: "+14085551234",
      office: "+14085555678",
      fax: "+14085559999"
    }
  },
  {
    name: '4. Multiple Emails',
    input: {
      rawText: "Bob Builder\nArchitect\nBuildIT Ltd\nwork@buildit.com\nbob.personal@gmail.com\n+91 11 2345 6789",
      lines: [
        { text: "Bob Builder", confidence: 1 },
        { text: "Architect", confidence: 1 },
        { text: "BuildIT Ltd", confidence: 1 },
        { text: "work@buildit.com", confidence: 1 },
        { text: "bob.personal@gmail.com", confidence: 1 },
        { text: "+91 11 2345 6789", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      emailsCount: 2,
      workEmail: "work@buildit.com",
      personalEmail: "bob.personal@gmail.com"
    }
  },
  {
    name: '5. Long Address',
    input: {
      rawText: "David Warner\nConsultant\nWarner Consulting\nWarner House\nPlot No. 42, Sector 18\nNoida, Uttar Pradesh 201301\nIndia\n+911204567890",
      lines: [
        { text: "David Warner", confidence: 1 },
        { text: "Consultant", confidence: 1 },
        { text: "Warner Consulting", confidence: 1 },
        { text: "Warner House", confidence: 1 },
        { text: "Plot No. 42, Sector 18", confidence: 1 },
        { text: "Noida, Uttar Pradesh 201301", confidence: 1 },
        { text: "India", confidence: 1 },
        { text: "+911204567890", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      officeAddress: "Warner House, Plot No. 42, Sector 18, Noida, Uttar Pradesh 201301, India"
    }
  },
  {
    name: '6. Logo-Heavy (Noisy names)',
    input: {
      rawText: "Antigravity Technologies\nSuper Tech logo\nCharlie Brown\nLead Developer\ncharlie@antigravity.tech",
      lines: [
        { text: "Antigravity Technologies", confidence: 1 },
        { text: "Super Tech logo", confidence: 1 },
        { text: "Charlie Brown", confidence: 1 },
        { text: "Lead Developer", confidence: 1 },
        { text: "charlie@antigravity.tech", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      company: "Antigravity Technologies",
      name: "Charlie Brown",
      designation: "Lead Developer"
    }
  },
  {
    name: '7. Different Orientation / Portrait Order',
    input: {
      rawText: "www.meta.com\nMeta Platforms Inc\nElon Musk\nProduct Lead\n+1 650 555 9876\nelon@meta.com",
      lines: [
        { text: "www.meta.com", confidence: 1 },
        { text: "Meta Platforms Inc", confidence: 1 },
        { text: "Elon Musk", confidence: 1 },
        { text: "Product Lead", confidence: 1 },
        { text: "+1 650 555 9876", confidence: 1 },
        { text: "elon@meta.com", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      name: "Elon Musk",
      designation: "Product Lead",
      company: "Meta Platforms Inc",
      website: "meta.com",
      email: "elon@meta.com"
    }
  },
  {
    name: '8. Low Light / Spacing Typos',
    input: {
      rawText: "Gautam Adani\nChairman\nAdani Group\n+91 79 2656 5555\ngautam @ adani . co . in\nwww . adani . com",
      lines: [
        { text: "Gautam Adani", confidence: 1 },
        { text: "Chairman", confidence: 1 },
        { text: "Adani Group", confidence: 1 },
        { text: "+91 79 2656 5555", confidence: 1 },
        { text: "gautam @ adani . co . in", confidence: 1 },
        { text: "www . adani . com", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      email: "gautam@adani.co.in",
      website: "adani.com"
    }
  },
  {
    name: '9. Different Fonts / Layout Designation fallback',
    input: {
      rawText: "Sundar Pichai\nGlobal Tech Coordinator\nGoogle Systems\nsundar@google.com",
      lines: [
        { text: "Sundar Pichai", confidence: 1 },
        { text: "Global Tech Coordinator", confidence: 1 },
        { text: "Google Systems", confidence: 1 },
        { text: "sundar@google.com", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      name: "Sundar Pichai",
      designation: "Global Tech Coordinator",
      company: "Google Systems"
    }
  },
  {
    name: '10. Missing Fields (Minimal card)',
    input: {
      rawText: "Narendra Modi\nnarendra@modi.org",
      lines: [
        { text: "Narendra Modi", confidence: 1 },
        { text: "narendra@modi.org", confidence: 1 }
      ],
      blocks: [],
      confidence: 1
    },
    expected: {
      name: "Narendra Modi",
      email: "narendra@modi.org"
    }
  }
];

const runParserTests = () => {
  console.log('--- Starting Contact Parser Service Real-Card Scenarios Tests ---');
  let passedCount = 0;

  for (const scenario of testScenarios) {
    console.log(`\nRunning Scenario: ${scenario.name}`);
    const result = contactParserService.parseOcrResult(scenario.input);

    // Assert results based on scenario expectations
    try {
      if (scenario.name.includes('Clear Card')) {
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.designation !== scenario.expected.designation) throw new Error(`Designation mismatch. Got "${result.designation}"`);
        if (result.company !== scenario.expected.company) throw new Error(`Company mismatch. Got "${result.company}"`);
        if (result.phones?.[0]?.value !== scenario.expected.phone) throw new Error(`Phone mismatch. Got "${result.phones?.[0]?.value}"`);
        if (result.emails?.[0]?.value !== scenario.expected.email) throw new Error(`Email mismatch. Got "${result.emails?.[0]?.value}"`);
        if (result.websites?.[0]?.value !== scenario.expected.website) throw new Error(`Website mismatch. Got "${result.websites?.[0]?.value}"`);
        if (result.officeAddress !== scenario.expected.officeAddress) throw new Error(`Address mismatch. Got "${result.officeAddress}"`);
      } else if (scenario.name.includes('Small Text')) {
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.designation !== scenario.expected.designation) throw new Error(`Designation mismatch. Got "${result.designation}"`);
        if (result.company !== scenario.expected.company) throw new Error(`Company mismatch. Got "${result.company}"`);
        if (result.phones?.[0]?.value !== scenario.expected.phone) throw new Error(`Phone mismatch. Got "${result.phones?.[0]?.value}"`);
        if (result.emails?.[0]?.value !== scenario.expected.email) throw new Error(`Email mismatch. Got "${result.emails?.[0]?.value}"`);
        if (result.officeAddress !== scenario.expected.officeAddress) throw new Error(`Address mismatch. Got "${result.officeAddress}"`);
      } else if (scenario.name.includes('Multiple Phones')) {
        if (result.phones?.length !== scenario.expected.phonesCount) throw new Error(`Phones length mismatch. Got ${result.phones?.length}`);
        const types = (result.phones || []).map(p => p.type);
        if (!types.includes('mobile') || !types.includes('office') || !types.includes('fax')) throw new Error('Phone types mapped incorrectly');
      } else if (scenario.name.includes('Multiple Emails')) {
        if (result.emails?.length !== scenario.expected.emailsCount) throw new Error(`Emails length mismatch. Got ${result.emails?.length}`);
      } else if (scenario.name.includes('Long Address')) {
        if (result.officeAddress !== scenario.expected.officeAddress) throw new Error(`Address mismatch. Got "${result.officeAddress}"`);
      } else if (scenario.name.includes('Logo-Heavy')) {
        if (result.company !== scenario.expected.company) throw new Error(`Company mismatch. Got "${result.company}"`);
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.designation !== scenario.expected.designation) throw new Error(`Designation mismatch. Got "${result.designation}"`);
      } else if (scenario.name.includes('Different Orientation')) {
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.designation !== scenario.expected.designation) throw new Error(`Designation mismatch. Got "${result.designation}"`);
        if (result.company !== scenario.expected.company) throw new Error(`Company mismatch. Got "${result.company}"`);
        if (result.websites?.[0]?.value !== scenario.expected.website) throw new Error(`Website mismatch. Got "${result.websites?.[0]?.value}"`);
        if (result.emails?.[0]?.value !== scenario.expected.email) throw new Error(`Email mismatch. Got "${result.emails?.[0]?.value}"`);
      } else if (scenario.name.includes('Low Light')) {
        if (result.emails?.[0]?.value !== scenario.expected.email) throw new Error(`Email mismatch. Got "${result.emails?.[0]?.value}"`);
        if (result.websites?.[0]?.value !== scenario.expected.website) throw new Error(`Website mismatch. Got "${result.websites?.[0]?.value}"`);
      } else if (scenario.name.includes('Different Fonts')) {
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.designation !== scenario.expected.designation) throw new Error(`Designation mismatch. Got "${result.designation}"`);
        if (result.company !== scenario.expected.company) throw new Error(`Company mismatch. Got "${result.company}"`);
      } else if (scenario.name.includes('Missing Fields')) {
        if (result.name !== scenario.expected.name) throw new Error(`Name mismatch. Got "${result.name}"`);
        if (result.emails?.[0]?.value !== scenario.expected.email) throw new Error(`Email mismatch. Got "${result.emails?.[0]?.value}"`);
        if (result.company || result.designation || result.officeAddress || result.phones?.length || result.websites?.length) {
          throw new Error('Invented fields that should be empty/null');
        }
      }

      console.log(`✓ Scenario "${scenario.name}" Passed!`);
      passedCount++;
    } catch (err: any) {
      console.error(`✗ Scenario "${scenario.name}" Failed:`, err.message);
    }
  }

  console.log(`\n=== PARSER TESTS SUMMARY: ${passedCount}/${testScenarios.length} PASSED ===`);
  if (passedCount === testScenarios.length) {
    console.log('ALL REAL CARD PARSING SCENARIOS PASSED COMPLIANCE!');
  } else {
    console.error('SOME PARSING SCENARIOS FAILED!');
  }
};

runParserTests();
